/** Longest edge of the stored image, in pixels. */
const MAX_EDGE = 1200;

/** WebP quality. 0.82 is where artefacts stop being visible on photos. */
const QUALITY = 0.82;

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Shrinks a picked photo before it ever reaches the network.
 *
 * A phone photo is 2–3 MB and gets drawn into a card a few hundred pixels
 * wide, so almost all of those bytes are paid for in egress and thrown away by
 * the browser. Supabase bills egress, not pixels: at full size a single search
 * page of 12 cards costs ~24 MB and the free 5 GB/month is gone in a couple of
 * hundred page views. Downscaled to WebP the same page costs well under 1 MB.
 *
 * Returns the original file untouched if anything fails — a slightly expensive
 * upload beats a registration that cannot proceed.
 */
export async function resizeImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.includes(file.type)) return file;

  try {
    // createImageBitmap with imageOrientation applies the EXIF rotation phones
    // write, which a bare <img> + drawImage would ignore — without it portrait
    // photos land sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY)
    );

    // Re-encoding can lose to an already well-compressed original, e.g. a small
    // PNG logo. Keep whichever is actually smaller.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}
