import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { activateSubscription } from '@/lib/activate-subscription';
import { sendEmail } from '@/lib/email';
import { paymentSuccessEmail, paymentFailedEmail, checkoutExpiredEmail } from '@/lib/email-templates';
import type Stripe from 'stripe';

interface Recipient {
  email: string;
  name: string;
  planName: string;
}

/**
 * Resolves who to write to. performer_id is the auth user id, so the address
 * lives in auth.users while the display name lives in performers.
 */
async function resolveRecipient(performerId: string, planId: string): Promise<Recipient | null> {
  const [{ data: authUser }, { data: performer }, { data: plan }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(performerId),
    supabaseAdmin.from('performers').select('stage_name').eq('id', performerId).single(),
    supabaseAdmin.from('subscription_plans').select('name').eq('id', planId).single(),
  ]);

  const email = authUser?.user?.email;
  if (!email) return null;

  return {
    email,
    name: performer?.stage_name || 'izvođaču',
    planName: plan?.name || 'pretplata',
  };
}

/**
 * Claims an event id, returning false if it was already handled.
 *
 * Stripe retries until it sees a 2xx and can redeliver even after success.
 * activateSubscription() tolerates that because it upserts, but email does not —
 * a redelivery would mean a second "uplata primljena". The primary key on
 * processed_stripe_events (021_stripe_event_log.sql) makes the duplicate insert
 * fail, which is the signal to skip.
 */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('processed_stripe_events')
    .insert({ id: event.id, type: event.type });

  if (!error) return true;

  // 23505 = unique_violation: the id is already there, so this is a redelivery
  // and the event genuinely must not be handled again.
  if (error.code === '23505') {
    console.log(`[stripe] Event ${event.id} (${event.type}) already processed — skipping`);
    return false;
  }

  // Anything else (missing table because 021 hasn't run, connection trouble)
  // is a problem with the ledger, not evidence of a duplicate. Failing open is
  // the safer side: a repeated email is recoverable, a subscription that was
  // paid for but never activated is not.
  console.error(
    `[stripe] Could not record event ${event.id} (${error.code}: ${error.message}) — processing anyway`
  );
  return true;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${error.message}` }, { status: 400 });
  }

  const handled = ['checkout.session.completed', 'checkout.session.expired', 'payment_intent.payment_failed'];
  if (!handled.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  if (!(await claimEvent(event))) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { performer_id, plan_id, billing_period } = session.metadata || {};

      if (performer_id && plan_id && billing_period) {
        const { data: subscription } = await activateSubscription({
          performerId: performer_id,
          planId: plan_id,
          billingPeriod: billing_period as 'monthly' | 'yearly',
          paymentMethod: 'stripe',
          stripeSessionId: session.id,
        });

        const recipient = await resolveRecipient(performer_id, plan_id);
        if (recipient) {
          const { subject, html } = paymentSuccessEmail({
            name: recipient.name,
            planName: recipient.planName,
            billingPeriod: billing_period as 'monthly' | 'yearly',
            // subscriptions.amount is written by activateSubscription from
            // subscription_plans.price, which is already in cents.
            amountCents: Number(subscription.amount),
            periodStart: subscription.period_start,
            periodEnd: subscription.period_end,
          });
          await sendEmail({ to: recipient.email, subject, html });
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { performer_id, plan_id } = session.metadata || {};

      // An expired session that was nonetheless paid is not an abandoned
      // checkout, and must not trigger a "you didn't finish" mail.
      if (performer_id && plan_id && session.payment_status !== 'paid') {
        const recipient = await resolveRecipient(performer_id, plan_id);
        if (recipient) {
          const { subject, html } = checkoutExpiredEmail({
            name: recipient.name,
            planName: recipient.planName,
          });
          await sendEmail({ to: recipient.email, subject, html });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { performer_id, plan_id } = intent.metadata || {};

      // Fires the moment a card is declined, while the payer is still on the
      // Stripe page and may well succeed on the next try — there is no way to
      // know yet. The copy in paymentFailedEmail is written to be harmless in
      // that case ("ako si već platio/la, zanemari") rather than pretending the
      // attempt was final.
      if (performer_id && plan_id) {
        const recipient = await resolveRecipient(performer_id, plan_id);
        if (recipient) {
          const { subject, html } = paymentFailedEmail({
            name: recipient.name,
            planName: recipient.planName,
            reason: intent.last_payment_error?.message,
          });
          await sendEmail({ to: recipient.email, subject, html });
        }
      }
    }
  } catch (error: any) {
    console.error(`[stripe] Failed handling ${event.type}:`, error.message);

    // Release the claim so Stripe's retry can have another go — otherwise the
    // event id stays booked and the retry is silently dropped as a duplicate.
    await supabaseAdmin.from('processed_stripe_events').delete().eq('id', event.id);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
