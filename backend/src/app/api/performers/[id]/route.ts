import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: performer, error } = await supabase
    .from('performers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !performer) {
    return NextResponse.json({ error: 'Performer not found' }, { status: 404 });
  }

  return NextResponse.json(performer);
}
