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

  const [performers, clients, pendingPerformers, inquiries, activeSubscriptions] = await Promise.all([
    supabaseAdmin.from('performers').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabaseAdmin.from('performers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('inquiries').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return NextResponse.json({
    total_performers: performers.count || 0,
    total_clients: clients.count || 0,
    pending_performers: pendingPerformers.count || 0,
    total_inquiries: inquiries.count || 0,
    active_subscriptions: activeSubscriptions.count || 0,
  });
}
