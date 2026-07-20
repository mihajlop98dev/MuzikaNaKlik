import { supabaseAdmin } from '@/lib/supabase-admin';

interface ActivateSubscriptionParams {
  performerId: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethod: 'manual' | 'stripe';
  stripeSessionId?: string;
  markedByAdmin?: string;
}

export async function activateSubscription({
  performerId,
  planId,
  billingPeriod,
  paymentMethod,
  stripeSessionId,
  markedByAdmin,
}: ActivateSubscriptionParams) {
  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('price, max_images, max_videos, has_repertoire, has_availability, has_review_reply, has_featured_badge, has_top_pick_badge, has_verified_badge, search_priority')
    .eq('id', planId)
    .single();

  const amount = billingPeriod === 'yearly' ? (plan?.price || 0) * 10 : (plan?.price || 0);
  const now = new Date();
  const periodEnd = new Date(now);

  if (billingPeriod === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('performer_id', performerId)
    .eq('status', 'active')
    .maybeSingle();

  let result;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: planId,
        amount,
        payment_method: paymentMethod,
        stripe_session_id: stripeSessionId,
        period_start: now.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        marked_by_admin: markedByAdmin,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseAdmin.from('subscriptions').insert({
      performer_id: performerId,
      plan_id: planId,
      amount,
      payment_method: paymentMethod,
      stripe_session_id: stripeSessionId,
      period_start: now.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      status: 'active',
      marked_by_admin: markedByAdmin,
    }).select().single();

    if (error) throw error;
    result = data;
  }

  await supabaseAdmin.from('performers').update({
    subscription_status: 'active',
    subscription_expires_at: periodEnd.toISOString(),
    search_priority: plan?.search_priority ?? 0,
    plan_max_images: plan?.max_images ?? 1,
    plan_max_videos: plan?.max_videos ?? 1,
    has_repertoire: plan?.has_repertoire ?? false,
    has_availability: plan?.has_availability ?? false,
    has_review_reply: plan?.has_review_reply ?? false,
    has_featured_badge: plan?.has_featured_badge ?? false,
    has_top_pick_badge: plan?.has_top_pick_badge ?? false,
    has_verified_badge: plan?.has_verified_badge ?? false,
  }).eq('id', performerId);

  return { updated: !!existing, data: result };
}
