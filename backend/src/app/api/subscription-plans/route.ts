import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data } = await supabaseAdmin
    .from('subscription_plans')
    .select('id, name, price, is_active')
    .eq('is_active', true);

  return NextResponse.json(data || []);
}
