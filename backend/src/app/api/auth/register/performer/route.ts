import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, stage_name, type, city, phone, genres, description, price_from, equipment, languages, member_count, travel_radius, audio_url, profile_image_url, videos } = await request.json();

    if (!email || !password || !stage_name) {
      return NextResponse.json({ error: 'Email, password, and stage name are required' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'performer',
        full_name: stage_name,
        stage_name,
        type: type || 'singer',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Update performer record with all data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    const { error: updateError } = await supabase
      .from('performers')
      .update(performerUpdates)
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update profile phone
    await supabase.from('profiles').update({ phone: phone || null }).eq('id', authData.user.id);

    // Insert videos if provided
    if (videos && Array.isArray(videos) && videos.length > 0) {
      const videoRecords = videos.map((url: string) => ({
        performer_id: authData.user.id,
        type: 'video',
        url: url,
        sort_order: 0,
      }));
      await supabase.from('performer_media').insert(videoRecords);
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'performer' },
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
