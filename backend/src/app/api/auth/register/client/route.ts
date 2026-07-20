import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'client', full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'client' },
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
