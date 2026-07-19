import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data } = await supabaseAdmin
    .from('subscription_plans')
    .select('id, name, price, is_active, description, features, max_images, max_videos, has_repertoire, has_availability, has_review_reply, has_featured_badge, has_top_pick_badge, has_featured_home, has_verified_badge, has_monthly_report, has_priority_support, search_priority')
    .eq('is_active', true);

  return NextResponse.json(data || []);
}
