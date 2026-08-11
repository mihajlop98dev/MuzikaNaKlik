import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';

/**
 * Starts a password reset.
 *
 * The app had no reset path at all, which became a lockout the moment login
 * was gated on a confirmed email: a forgotten password left no way in short of
 * an admin editing the account by hand.
 */
export async function POST(request: Request) {
  // Same answer either way, so this cannot be used to discover which addresses
  // are registered.
  const genericOk = NextResponse.json({
    message: 'Ako nalog sa tom adresom postoji, poslali smo link za novu lozinku.',
  });

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/nova-lozinka` },
    });

    if (error || !data?.user) {
      return genericOk;
    }

    const name =
      (data.user.user_metadata?.stage_name as string) ||
      (data.user.user_metadata?.full_name as string) ||
      'korisniče';

    const { subject, html } = passwordResetEmail({
      name,
      resetUrl: data.properties.action_link,
    });
    await sendEmail({ to: email, subject, html });

    return genericOk;
  } catch (_err) {
    return genericOk;
  }
}
