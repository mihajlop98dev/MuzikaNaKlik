import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { activateSubscription } from '@/lib/activate-subscription';


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
  const billingPeriod = body.billing_period || 'monthly';

  let result;
  try {
    result = await activateSubscription({
      performerId: body.performer_id,
      planId: body.plan_id,
      billingPeriod,
      paymentMethod: 'manual',
      markedByAdmin: user.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: logError } = await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: result.updated ? 'renew_subscription' : 'create_subscription',
    details: { performer_id: body.performer_id, plan_id: body.plan_id, billing_period: billingPeriod },
  });
  if (logError) console.error('Failed to write activity log:', logError);

  return NextResponse.json(result, { status: 201 });
}
