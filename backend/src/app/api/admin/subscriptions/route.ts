import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';


export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';

  let query = supabaseAdmin
    .from('subscriptions')
    .select('*, performers(stage_name, id), subscription_plans(name, price)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();

  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('price, max_images, max_videos, has_repertoire, has_availability, has_review_reply, has_featured_badge, has_top_pick_badge, has_verified_badge, search_priority')
    .eq('id', body.plan_id)
    .single();

  const billingPeriod = body.billing_period || 'monthly';
  const amount = billingPeriod === 'yearly' ? (plan?.price || 0) * 10 : (plan?.price || 0);
  const now = new Date();
  const periodEnd = new Date(now);

  if (billingPeriod === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Check if performer already has an active subscription
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('performer_id', body.performer_id)
    .eq('status', 'active')
    .maybeSingle();

  let result;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: body.plan_id,
        amount,
        period_start: now.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        marked_by_admin: user.id,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabaseAdmin.from('subscriptions').insert({
      performer_id: body.performer_id,
      plan_id: body.plan_id,
      amount,
      payment_method: 'manual',
      period_start: now.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      status: 'active',
      marked_by_admin: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  await supabaseAdmin.from('performers').update({
    subscription_status: 'active',
    subscription_expires_at: periodEnd.toISOString(),
    search_priority: plan?.search_priority ?? 0,
    plan_max_images: plan?.max_images ?? 1,
    plan_max_videos: plan?.max_videos ?? 1,
    has_repertoire: plan?.has_repertoire ?? false,
    has_availability: plan?.has_availability ?? false,
    has_review_reply: plan?.has_review_reply ?? false,
    has_featured_badge: plan?.has_featured_badge ?? false,
    has_top_pick_badge: plan?.has_top_pick_badge ?? false,
    has_verified_badge: plan?.has_verified_badge ?? false,
  }).eq('id', body.performer_id);

  const { error: logError } = await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: existing ? 'renew_subscription' : 'create_subscription',
    details: { performer_id: body.performer_id, plan_id: body.plan_id, billing_period: billingPeriod },
  });
  if (logError) console.error('Failed to write activity log:', logError);

  return NextResponse.json({ updated: !!existing, data: result }, { status: 201 });
}
