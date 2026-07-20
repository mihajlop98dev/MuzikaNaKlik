import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();

  if (body.role) {
    await supabaseAdmin.from('profiles').update({ role: body.role }).eq('id', id);
  }

  if (body.performer_status) {
    await supabaseAdmin.from('performers').update({ status: body.performer_status }).eq('id', id);
  }

  const { error: logError } = await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'update_user',
    details: { target_user_id: id, role: body.role, performer_status: body.performer_status },
  });
  if (logError) console.error('Failed to write activity log:', logError);

  return NextResponse.json({ success: true });
}
