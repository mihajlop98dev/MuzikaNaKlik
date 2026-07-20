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

  const { data: planDist } = await supabaseAdmin
    .from('subscriptions')
    .select('subscription_plans(name)')
    .eq('status', 'active');

  const planCounts: Record<string, number> = {};
  planDist?.forEach((s: any) => {
    const name = s.subscription_plans?.name || 'Unknown';
    planCounts[name] = (planCounts[name] || 0) + 1;
  });

  const { data: statusDist } = await supabaseAdmin
    .from('performers')
    .select('status');

  const statusCounts: Record<string, number> = {};
  statusDist?.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  return NextResponse.json({
    planDistribution: Object.entries(planCounts).map(([name, count]) => ({ name, count })),
    statusDistribution: Object.entries(statusCounts).map(([name, count]) => ({ name, count })),
  });
}
