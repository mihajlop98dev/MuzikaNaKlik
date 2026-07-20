import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { activateSubscription } from '@/lib/activate-subscription';
import type Stripe from 'stripe';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { performer_id, plan_id, billing_period } = session.metadata || {};

    if (performer_id && plan_id && billing_period) {
      try {
        await activateSubscription({
          performerId: performer_id,
          planId: plan_id,
          billingPeriod: billing_period as 'monthly' | 'yearly',
          paymentMethod: 'stripe',
          stripeSessionId: session.id,
        });
      } catch (error: any) {
        console.error('Failed to activate subscription from Stripe webhook:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
