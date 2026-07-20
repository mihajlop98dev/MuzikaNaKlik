import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { plan_id, billing_period } = await request.json();
  if (!plan_id || !['monthly', 'yearly'].includes(billing_period)) {
    return NextResponse.json({ error: 'plan_id and billing_period are required' }, { status: 400 });
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('id, name, price, is_active')
    .eq('id', plan_id)
    .single();

  if (planError || !plan || !plan.is_active) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // subscription_plans.price is already stored in cents (matches Stripe's
  // native unit and the convention used everywhere else this column is read,
  // e.g. admin-subscriptions.component.html divides by 100 for display).
  const amountCents = billing_period === 'yearly' ? plan.price * 10 : plan.price;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${plan.name} — ${billing_period === 'yearly' ? 'godišnja' : 'mesečna'} pretplata`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/moj-nalog/izvodjac/pretplata?stripe=success`,
    cancel_url: `${siteUrl}/moj-nalog/izvodjac/pretplata?stripe=canceled`,
    metadata: {
      performer_id: user.id,
      plan_id: plan.id,
      billing_period,
    },
  });

  return NextResponse.json({ url: session.url });
}
