import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { newInquiryEmail, newMessageEmail } from '@/lib/email-templates';

async function addressFor(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

/**
 * Emails the other party about a new inquiry or a new message in its thread.
 *
 * Both events already wrote an in-app notification row, which only helps
 * someone who happens to log in. For a booking site the inquiry is the whole
 * point, so a performer who checks the site once a week was simply losing work.
 *
 * The mail is sent from the server rather than the browser because it needs
 * the counterpart's address, which RLS deliberately keeps out of client reach.
 * The caller must be a party to the inquiry — checked below — so this cannot be
 * used to make the site send mail to arbitrary users.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { inquiry_id, kind, preview } = await request.json();
  if (!inquiry_id || !['inquiry', 'message'].includes(kind)) {
    return NextResponse.json({ error: 'inquiry_id and kind are required' }, { status: 400 });
  }

  const { data: inquiry, error } = await supabaseAdmin
    .from('inquiries')
    .select('id, client_id, performer_id, full_name, event_type, event_date, location, message, performers(stage_name)')
    .eq('id', inquiry_id)
    .single();

  if (error || !inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }

  const isClient = inquiry.client_id === user.id;
  const isPerformer = inquiry.performer_id === user.id;
  if (!isClient && !isPerformer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const performerName = (inquiry.performers as any)?.stage_name || 'izvođaču';

  if (kind === 'inquiry') {
    // Only the client who created it can trigger the initial notification.
    if (!isClient) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Written here rather than from the browser: the notifications insert policy
    // accepts anyone, so a client-side insert meant every performer id — which
    // is public — could be spammed with arbitrary text by an anonymous caller.
    await supabaseAdmin.from('notifications').insert({
      user_id: inquiry.performer_id,
      type: 'new_inquiry',
      title: 'Novi upit',
      message: `Imate novi upit od ${inquiry.full_name} za ${inquiry.event_type || 'događaj'}.`,
      link: '/moj-nalog/izvodjac/upiti',
    });

    const to = await addressFor(inquiry.performer_id);
    if (!to) return NextResponse.json({ sent: false });

    const { subject, html } = newInquiryEmail({
      performerName,
      clientName: inquiry.full_name,
      eventType: inquiry.event_type,
      eventDate: inquiry.event_date,
      location: inquiry.location,
      message: inquiry.message,
    });
    await sendEmail({ to, subject, html });
    return NextResponse.json({ sent: true });
  }

  // kind === 'message' — goes to whichever side did not write it.
  const recipientId = isPerformer ? inquiry.client_id : inquiry.performer_id;
  if (!recipientId) return NextResponse.json({ sent: false });

  const body = (preview || '').toString();
  await supabaseAdmin.from('notifications').insert({
    user_id: recipientId,
    type: isPerformer ? 'inquiry_reply' : 'new_inquiry',
    title: isPerformer ? 'Nova poruka od izvođača' : 'Nova poruka od klijenta',
    message: body.length > 80 ? body.slice(0, 80) + '…' : body,
    link: isPerformer ? '/moji-upiti' : '/moj-nalog/izvodjac/upiti',
  });

  const to = await addressFor(recipientId);
  if (!to) return NextResponse.json({ sent: false });

  const { data: recipientProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', recipientId)
    .single();

  const { subject, html } = newMessageEmail({
    recipientName: recipientProfile?.full_name || 'korisniče',
    senderName: isPerformer ? performerName : inquiry.full_name,
    senderRole: isPerformer ? 'performer' : 'client',
    preview: (preview || '').toString().slice(0, 400),
  });
  await sendEmail({ to, subject, html });

  return NextResponse.json({ sent: true });
}
