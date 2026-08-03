import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { verificationEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

    // generateLink() rather than createUser() — see the note in the performer
    // route: it creates the user unconfirmed and returns the confirmation link,
    // which createUser() cannot do.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { role: 'client', full_name },
        redirectTo: `${siteUrl}/prijava?potvrda=uspesna`,
      },
    });

    if (authError || !authData?.user) {
      return NextResponse.json({ error: authError?.message ?? 'Registration failed' }, { status: 400 });
    }

    const { subject, html } = verificationEmail({
      name: full_name,
      confirmUrl: authData.properties.action_link,
    });
    await sendEmail({ to: email, subject, html });

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'client' },
      emailConfirmationRequired: true,
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
