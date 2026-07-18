import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { performer_id, full_name, email, phone, event_type, event_date, location, message } = body;

    if (!performer_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'performer_id, full_name, and email are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        performer_id,
        full_name,
        email,
        phone,
        event_type,
        event_date,
        location,
        message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('notifications').insert({
      user_id: performer_id,
      type: 'new_inquiry',
      title: 'Novi upit',
      message: `Imate novi upit od ${full_name} za ${event_type || 'događaj'}.`,
      link: '/moj-nalog/izvodjac/upiti',
    });

    return NextResponse.json(data, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
