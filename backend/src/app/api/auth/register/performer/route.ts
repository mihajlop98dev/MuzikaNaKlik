import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';
import { verificationEmail } from '@/lib/email-templates';
import { uploadImage } from '@/lib/upload-image';

export async function POST(request: Request) {
  try {
    // Registration accepts multipart when the applicant picked a profile photo.
    // It cannot be uploaded beforehand: /api/storage/upload needs a bearer token
    // and during signup no account — hence no session — exists yet. The file
    // therefore rides along and is stored below, once there is a user id to
    // file it under.
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let imageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const raw = form.get('payload');
      body = typeof raw === 'string' ? JSON.parse(raw) : {};
      const candidate = form.get('file');
      if (candidate instanceof File && candidate.size > 0) imageFile = candidate;
    } else {
      body = await request.json();
    }

    const { email, password, stage_name, type, city, phone, genres, description, price_from, equipment, languages, member_count, audio_url, profile_image_url, videos, plan_id, billing_period } = body;

    if (!email || !password || !stage_name) {
      return NextResponse.json({ error: 'Email, password, and stage name are required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

    // Subscription activation (status/badges/search priority) is never set
    // here from client input — it only ever happens via activateSubscription(),
    // called from the Stripe webhook after a real payment, or by an admin.
    // See supabase/migrations/019_prevent_performer_self_upgrade.sql.
    //
    // generateLink() rather than createUser(): it creates the user *unconfirmed*
    // and hands back the confirmation link in one call. createUser() never sends
    // mail on its own — with email_confirm:false it would leave an account nobody
    // can ever confirm. The on_auth_user_created trigger (003_triggers.sql) fires
    // either way, so profiles/performers rows are still created here.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { role: 'performer', full_name: stage_name, stage_name, type: type || 'singer' },
        redirectTo: `${siteUrl}/prijava?potvrda=uspesna`,
      },
    });

    if (authError || !authData?.user) {
      return NextResponse.json({ error: authError?.message ?? 'Registration failed' }, { status: 400 });
    }

    const confirmUrl = authData.properties.action_link;

    // Stored under the new user's id, exactly where an authenticated upload
    // would have put it. A failure here is not fatal: the account is already
    // created, and losing the photo is far better than losing the registration
    // — the performer can add it from profile edit afterwards.
    let uploadedImageUrl: string | null = null;
    if (imageFile) {
      const result = await uploadImage({ file: imageFile, ownerId: authData.user.id });
      if (result.ok) {
        uploadedImageUrl = result.url;
      } else {
        console.error('[register] Profile image upload failed:', result.error);
      }
    }

    const performerUpdates: Record<string, any> = {
      stage_name,
      type: type || 'singer',
      city: city || null,
      genres: genres || [],
      description: description || null,
      price_from: price_from || null,
      equipment: equipment || [],
      languages: languages || [],
      member_count: member_count || null,
      audio_url: audio_url || null,
      // The uploaded file wins over the manually typed URL — picking a photo is
      // the more deliberate of the two actions.
      profile_image_url: uploadedImageUrl || profile_image_url || null,
    };

    const { error: updateError } = await supabaseAdmin
      .from('performers')
      .update(performerUpdates)
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabaseAdmin.from('profiles').update({ phone: phone || null }).eq('id', authData.user.id);

    if (videos && Array.isArray(videos) && videos.length > 0) {
      const videoRecords = videos.map((url: string) => ({
        performer_id: authData.user.id,
        type: 'video',
        url: url,
        sort_order: 0,
      }));
      await supabaseAdmin.from('performer_media').insert(videoRecords);
    }

    const { data: adminProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    // Informational rather than a to-do: since 022 the profile publishes itself
    // once the email is confirmed, so there is nothing for an admin to approve.
    // It stays because admins still moderate — this is how they learn a new
    // profile is live in time to take it down if it shouldn't be.
    if (adminProfiles) {
      const adminNotifications = adminProfiles.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'new_performer',
        title: 'Novi izvođač',
        message: `${stage_name} se registrovao. Profil postaje vidljiv čim potvrdi email.`,
        link: '/admin/izvodjaci',
      }));
      await supabaseAdmin.from('notifications').insert(adminNotifications);
    }

    let checkoutUrl: string | null = null;

    if (plan_id && ['monthly', 'yearly'].includes(billing_period)) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('id, name, price, is_active')
        .eq('id', plan_id)
        .single();

      if (plan?.is_active) {
        const amountCents = billing_period === 'yearly' ? plan.price * 10 : plan.price;

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: email,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `${plan.name} — ${billing_period === 'yearly' ? 'godišnja' : 'mesečna'} pretplata`,
                },
                unit_amount: amountCents,
              },
              quantity: 1,
            },
          ],
          success_url: `${siteUrl}/prijava?registracija=uspesna`,
          cancel_url: `${siteUrl}/prijava?registracija=placanje-otkazano`,
          metadata: {
            performer_id: authData.user.id,
            plan_id: plan.id,
            billing_period,
          },
          // Duplicated onto the PaymentIntent because payment_intent.payment_failed
          // carries the intent, not the session — without this the webhook has no
          // way to tell who a declined card belonged to.
          payment_intent_data: {
            metadata: {
              performer_id: authData.user.id,
              plan_id: plan.id,
              billing_period,
            },
          },
        });

        checkoutUrl = session.url;
      }
    }

    // Sent last, and deliberately not awaited into the failure path: the account
    // already exists and Stripe checkout is already created, so a mail outage
    // must not turn a successful registration into a 500. /api/auth/resend-confirmation
    // is the recovery path when this fails.
    const { subject, html } = verificationEmail({ name: stage_name, confirmUrl });
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'performer' },
      checkoutUrl,
      emailConfirmationRequired: true,
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
