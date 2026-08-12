import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'Muzika na Klik <noreply@muzikanaklik.com>';

/**
 * Where replies go.
 *
 * Mail is sent from noreply@, which nobody reads. Without this a performer who
 * answers a "new inquiry" or "payment received" notice is writing into a void —
 * and answering mail is exactly what they will try to do.
 */
const replyTo = process.env.EMAIL_REPLY_TO || 'vvkdigital@muzikanaklik.com';

const resend = apiKey ? new Resend(apiKey) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email and never throws.
 *
 * Every caller sits on a critical path — registration, or a Stripe webhook that
 * must return 200 or Stripe will retry and re-activate the subscription. A dead
 * mail provider must not roll back a paid subscription, so failures are logged
 * and swallowed. The boolean is for callers that want to branch on it.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.error('[email] RESEND_API_KEY is not set — skipping send to', to);
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, html, replyTo });

    if (error) {
      console.error('[email] Resend rejected message to', to, '-', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('[email] Failed to send to', to, '-', err?.message ?? err);
    return false;
  }
}
