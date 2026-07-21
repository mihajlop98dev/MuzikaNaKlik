import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ALLOWED_BUCKETS = ['profiles'];
const ALLOWED_FOLDERS = ['performers', 'gallery'];
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const bucket = (formData.get('bucket') as string) || 'profiles';
  const folder = (formData.get('folder') as string) || 'performers';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  const fileExt = ALLOWED_MIME_TO_EXT[file.type];
  if (!fileExt) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WEBP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds the 5MB limit' }, { status: 400 });
  }

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
