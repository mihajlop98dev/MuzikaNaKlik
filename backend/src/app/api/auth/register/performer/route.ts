import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, stage_name, type, city, phone, genres, description, price_from, equipment, languages, member_count, travel_radius, audio_url, profile_image_url, videos, plan_id, billing_period } = await request.json();

    if (!email || !password || !stage_name) {
      return NextResponse.json({ error: 'Email, password, and stage name are required' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'performer', full_name: stage_name, stage_name, type: type || 'singer' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const isComplete = !!(plan_id && billing_period);

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
      travel_radius: travel_radius || null,
      audio_url: audio_url || null,
      profile_image_url: profile_image_url || null,
    };

    if (isComplete) {
      performerUpdates.status = 'approved';
      performerUpdates.subscription_status = 'active';
      performerUpdates.subscription_expires_at = new Date(
        Date.now() + (billing_period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const { error: updateError } = await supabase
      .from('performers')
      .update(performerUpdates)
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from('profiles').update({ phone: phone || null }).eq('id', authData.user.id);

    if (videos && Array.isArray(videos) && videos.length > 0) {
      const videoRecords = videos.map((url: string) => ({
        performer_id: authData.user.id,
        type: 'video',
        url: url,
        sort_order: 0,
      }));
      await supabase.from('performer_media').insert(videoRecords);
    }

    if (isComplete) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('price, max_images, max_videos, has_repertoire, has_availability, has_review_reply, has_featured_badge, has_top_pick_badge, has_verified_badge, search_priority')
        .eq('id', plan_id)
        .single();

      const now = new Date();
      const periodEnd = new Date(now);
      if (billing_period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await supabase.from('subscriptions').insert({
        performer_id: authData.user.id,
        plan_id,
        amount: plan?.price || 0,
        payment_method: 'manual',
        period_start: now.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'active',
      });

      await supabaseAdmin.from('performers').update({
        search_priority: plan?.search_priority ?? 0,
        plan_max_images: plan?.max_images ?? 1,
        plan_max_videos: plan?.max_videos ?? 1,
        has_repertoire: plan?.has_repertoire ?? false,
        has_availability: plan?.has_availability ?? false,
        has_review_reply: plan?.has_review_reply ?? false,
        has_featured_badge: plan?.has_featured_badge ?? false,
        has_top_pick_badge: plan?.has_top_pick_badge ?? false,
        has_verified_badge: plan?.has_verified_badge ?? false,
      }).eq('id', authData.user.id);
    }

    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminProfiles) {
      const adminNotifications = adminProfiles.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'new_performer',
        title: isComplete ? 'Novi izvođač registrovan' : 'Novi izvođač na čekanju',
        message: isComplete
          ? `${stage_name} se registrovao sa aktivnom pretplatom.`
          : `${stage_name} se registrovao i čeka odobrenje.`,
        link: '/admin/izvodjaci',
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'performer' },
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
