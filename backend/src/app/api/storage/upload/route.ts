import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const bucket = formData.get('bucket') as string || 'profiles';
  const folder = formData.get('folder') as string || 'performers';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  const fileBuffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl, path: data.path });
}
