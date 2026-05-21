const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
};

/** Client-side cap; bucket/global limits may be lower until configured in Supabase. */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export function contentTypeForExtension(ext: string): string {
  const lower = ext.toLowerCase();
  return VIDEO_MIME[lower] ?? IMAGE_MIME[lower] ?? 'application/octet-stream';
}

export function maxBytesForExtension(ext: string): number {
  return ['mp4', 'webm'].includes(ext.toLowerCase()) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function formatStorageUploadError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Upload failed. Please try again.';
  }

  const e = err as {
    message?: string;
    error?: string;
    statusCode?: string | number;
  };
  const raw = [e.message, e.error].filter(Boolean).join(' ').toLowerCase();

  if (
    raw.includes('maximum') ||
    raw.includes('too large') ||
    raw.includes('entitytoolarge') ||
    e.statusCode === '413' ||
    e.statusCode === 413
  ) {
    return (
      'File is too large for Storage. On the free plan the global limit is often 50 MB — ' +
      'in Supabase Dashboard go to Storage → Settings and raise the global file size limit, ' +
      'then set the game_assets bucket limit to match. Or use a smaller video.'
    );
  }

  if (raw.includes('mime') || raw.includes('invalidrequest')) {
    return 'Upload rejected (invalid file type). Use MP4 or WebM for video, or JPG/PNG/GIF/WEBP for images.';
  }

  if (raw.includes('row-level security') || raw.includes('policy')) {
    return 'Upload not permitted. Sign in again, or ask an admin to run the storage migration.';
  }

  if (raw.includes('already exists') || raw.includes('duplicate')) {
    return 'A file with this name already exists. Try uploading again.';
  }

  return e.message || e.error || 'Upload failed. Check file size (videos up to 500 MB if Storage is configured).';
}
