import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { verificationEmail } from '@/lib/email-templates';

/**
 * Re-sends a confirmation link to an account that exists but is not confirmed.
 *
 * Needed because login is hard-gated on a confirmed email: without this, anyone
 * who loses the first mail is permanently locked out with no self-service path.
 *
 * Uses a magiclink rather than a signup link — generateLink({ type: 'signup' })
 * creates a user and errors on an address that is already registered, so it
 * cannot be replayed. Following a magiclink both signs the user in and stamps
 * email_confirmed_at, which is exactly what confirmation needs to do.
 */
export async function POST(request: Request) {
  // Replies are deliberately identical whether or not the address exists, so
  // this endpoint cannot be used to enumerate registered users.
  const genericOk = NextResponse.json({
    message: 'Ako nalog postoji i nije potvrđen, poslali smo novi link za potvrdu.',
  });

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/prijava?potvrda=uspesna` },
    });

    if (error || !data?.user) {
      return genericOk;
    }

    // Already confirmed — nothing to resend, and sending a login link to an
    // address that did not ask for one would be worse than doing nothing.
    if (data.user.email_confirmed_at) {
      return genericOk;
    }

    const name =
      (data.user.user_metadata?.stage_name as string) ||
      (data.user.user_metadata?.full_name as string) ||
      'korisniče';

    const { subject, html } = verificationEmail({
      name,
      confirmUrl: data.properties.action_link,
    });
    await sendEmail({ to: email, subject, html });

    return genericOk;
  } catch (_err) {
    return genericOk;
  }
}
