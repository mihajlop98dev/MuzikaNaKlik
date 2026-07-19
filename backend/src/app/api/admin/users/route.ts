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
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const performerIds = profiles?.filter(p => p.role === 'performer').map(p => p.id) || [];
  let performersMap: Record<string, any> = {};

  if (performerIds.length > 0) {
    const { data: performers } = await supabaseAdmin
      .from('performers')
      .select('id, stage_name, status, subscription_status')
      .in('id', performerIds);

    if (performers) {
      performers.forEach(p => { performersMap[p.id] = p; });
    }
  }

  let subscriptionsMap: Record<string, any> = {};
  if (performerIds.length > 0) {
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('performer_id, plan_id, amount, period_start, period_end, status, subscription_plans(name)')
      .eq('status', 'active')
      .in('performer_id', performerIds);

    if (subscriptions) {
      subscriptions.forEach(s => { subscriptionsMap[s.performer_id] = s; });
    }
  }

  const result = profiles?.map(p => ({
    ...p,
    stage_name: performersMap[p.id]?.stage_name || null,
    performer_status: performersMap[p.id]?.status || null,
    subscription_status: performersMap[p.id]?.subscription_status || null,
    subscription: subscriptionsMap[p.id] || null,
  })) || [];

  return NextResponse.json(result);
}
