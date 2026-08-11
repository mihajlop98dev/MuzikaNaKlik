import { supabaseAdmin } from '@/lib/supabase-admin';

export const ALLOWED_BUCKETS = ['profiles'];
export const ALLOWED_FOLDERS = ['performers', 'gallery'];
export const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string; status: number };

/**
 * Validates and stores an uploaded image, keyed by owner id.
 *
 * Shared by /api/storage/upload and the performer registration route so the
 * size and MIME limits cannot drift apart between the two entry points.
 */
export async function uploadImage(params: {
  file: File;
  ownerId: string;
  bucket?: string;
  folder?: string;
}): Promise<UploadResult> {
  const bucket = params.bucket || 'profiles';
  const folder = params.folder || 'performers';

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return { ok: false, error: 'Invalid bucket', status: 400 };
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    return { ok: false, error: 'Invalid folder', status: 400 };
  }

  const fileExt = ALLOWED_MIME_TO_EXT[params.file.type];
  if (!fileExt) {
    return { ok: false, error: 'Only JPEG, PNG, or WEBP images are allowed', status: 400 };
  }

  if (params.file.size > MAX_FILE_SIZE) {
    return { ok: false, error: 'File exceeds the 5MB limit', status: 400 };
  }

  const filePath = `${folder}/${params.ownerId}/${Date.now()}.${fileExt}`;
  const fileBuffer = await params.file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: params.file.type,
      upsert: true,
    });

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return { ok: true, url: publicUrl, path: data.path };
}
