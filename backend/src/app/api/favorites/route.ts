import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.from('favorites').select('*, performers(*)').eq('client_id', user.id);
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { performer_id } = await request.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Check if already favorited
  const { data: existing } = await supabase.from('favorites').select('id').eq('client_id', user.id).eq('performer_id', performer_id).single();

  if (existing) {
    // Toggle OFF
    await supabase.from('favorites').delete().eq('id', existing.id);
    return NextResponse.json({ favorited: false });
  } else {
    // Toggle ON
    await supabase.from('favorites').insert({ client_id: user.id, performer_id });
    return NextResponse.json({ favorited: true }, { status: 201 });
  }
}
