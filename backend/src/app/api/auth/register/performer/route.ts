import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { email, password, stage_name, type, city, phone, genres, description, price_from, equipment, languages, member_count, audio_url, profile_image_url, videos, plan_id, billing_period } = await request.json();

    if (!email || !password || !stage_name) {
      return NextResponse.json({ error: 'Email, password, and stage name are required' }, { status: 400 });
    }

    // Subscription activation (status/badges/search priority) is never set
    // here from client input — it only ever happens via activateSubscription(),
    // called from the Stripe webhook after a real payment, or by an admin.
    // See supabase/migrations/019_prevent_performer_self_upgrade.sql.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'performer', full_name: stage_name, stage_name, type: type || 'singer' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
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
      profile_image_url: profile_image_url || null,
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

    if (adminProfiles) {
      const adminNotifications = adminProfiles.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'new_performer',
        title: 'Novi izvođač na čekanju',
        message: `${stage_name} se registrovao i čeka odobrenje.`,
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
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

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
        });

        checkoutUrl = session.url;
      }
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'performer' },
      checkoutUrl,
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
