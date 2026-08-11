import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { subscriptionExpiringEmail, subscriptionExpiredEmail } from '@/lib/email-templates';

/** How many days before period_end the warning goes out. */
const REMINDER_DAYS = 7;

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function recipientFor(performerId: string): Promise<{ email: string; name: string } | null> {
  const [{ data: authUser }, { data: performer }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(performerId),
    supabaseAdmin.from('performers').select('stage_name').eq('id', performerId).single(),
  ]);

  const email = authUser?.user?.email;
  if (!email) return null;

  return { email, name: performer?.stage_name || 'izvođaču' };
}

/**
 * Daily sweep that ends subscriptions whose period is over.
 *
 * Until this existed nothing ever moved subscription_status off 'active':
 * activateSubscription() wrote subscription_expires_at and no code read it, so
 * one month's payment kept badges, search priority and visibility forever.
 *
 * Runs from Vercel Cron (vercel.json). Requests must carry CRON_SECRET —
 * without it, anyone who guessed the path could expire every subscription on
 * the site.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const reminderCutoff = new Date(today);
  reminderCutoff.setDate(reminderCutoff.getDate() + REMINDER_DAYS);

  const result = { expired: 0, reminded: 0, errors: [] as string[] };

  // --- 1. Subscriptions whose period has ended -----------------------------
  const { data: lapsed, error: lapsedError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, performer_id, plan_id, subscription_plans(name)')
    .eq('status', 'active')
    .lt('period_end', isoDate(today));

  if (lapsedError) {
    return NextResponse.json({ error: lapsedError.message }, { status: 500 });
  }

  for (const sub of lapsed || []) {
    try {
      await supabaseAdmin.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);

      // Perks are reset here rather than left to decay: search_priority and the
      // badge flags are read straight off performers, so leaving them set would
      // keep an unpaid profile ranked above paying ones.
      await supabaseAdmin
        .from('performers')
        .update({
          subscription_status: 'expired',
          search_priority: 0,
          has_featured_badge: false,
          has_top_pick_badge: false,
          has_verified_badge: false,
        })
        .eq('id', sub.performer_id);

      const recipient = await recipientFor(sub.performer_id);
      if (recipient) {
        const planName = (sub.subscription_plans as any)?.name || 'pretplata';
        const { subject, html } = subscriptionExpiredEmail({ name: recipient.name, planName });
        await sendEmail({ to: recipient.email, subject, html });
      }

      result.expired++;
    } catch (err: any) {
      result.errors.push(`expire ${sub.id}: ${err.message}`);
    }
  }

  // --- 2. Subscriptions about to end ---------------------------------------
  const { data: expiring, error: expiringError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, performer_id, period_end, subscription_plans(name)')
    .eq('status', 'active')
    .is('reminder_sent_at', null)
    .gte('period_end', isoDate(today))
    .lte('period_end', isoDate(reminderCutoff));

  if (expiringError) {
    return NextResponse.json({ ...result, error: expiringError.message }, { status: 500 });
  }

  for (const sub of expiring || []) {
    try {
      const recipient = await recipientFor(sub.performer_id);
      if (recipient) {
        const end = new Date(sub.period_end);
        const daysLeft = Math.max(
          1,
          Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        );
        const planName = (sub.subscription_plans as any)?.name || 'pretplata';
        const { subject, html } = subscriptionExpiringEmail({
          name: recipient.name,
          planName,
          periodEnd: sub.period_end,
          daysLeft,
        });
        await sendEmail({ to: recipient.email, subject, html });
      }

      // Stamped even when there was no address to write to — otherwise this row
      // is retried every single day for the rest of the period.
      await supabaseAdmin
        .from('subscriptions')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', sub.id);

      result.reminded++;
    } catch (err: any) {
      result.errors.push(`remind ${sub.id}: ${err.message}`);
    }
  }

  console.log('[cron] subscriptions:', JSON.stringify(result));
  return NextResponse.json(result);
}
