import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { contactMessageEmail } from '@/lib/email-templates';

/**
 * Delivers a message from the public contact form.
 *
 * The form previously had no server side at all — submit() set a flag and
 * showed "Poruka je poslata!" while the message went nowhere, so anyone
 * writing in believed they had reached someone.
 *
 * Public by necessity: the whole point is that a visitor with no account can
 * get in touch.
 */
export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Sva polja su obavezna.' }, { status: 400 });
    }

    if (typeof message !== 'string' || message.length > 5000) {
      return NextResponse.json({ error: 'Poruka je predugačka.' }, { status: 400 });
    }

    const to = process.env.EMAIL_REPLY_TO || 'vvkdigital@muzikanaklik.com';

    const { subject, html } = contactMessageEmail({
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      message,
    });

    // replyTo is the sender's address, so hitting Reply in the inbox answers
    // the visitor rather than the site's own mailbox.
    const ok = await sendEmail({ to, subject, html, replyTo: String(email).slice(0, 200) });

    if (!ok) {
      return NextResponse.json(
        { error: 'Slanje trenutno ne radi. Piši nam direktno na ' + to },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
