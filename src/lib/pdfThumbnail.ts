/**
 * Build a first-page JPEG thumbnail URL from a Cloudinary PDF delivery URL
 * by inserting an on-the-fly transformation right after the upload segment.
 * Falls back to the original URL when the pattern does not match.
 * @param secureUrl - Cloudinary secure delivery URL of the PDF
 * @returns Thumbnail URL pointing to page 1 rendered as JPEG
 */
export function getPdfThumbnailUrl(secureUrl: string): string {
  const THUMBNAIL_TRANSFORMATION = 'w_400,c_limit,f_jpg';
  if (!secureUrl.includes('/upload/')) return secureUrl;
  return secureUrl.replace('/upload/', `/upload/${THUMBNAIL_TRANSFORMATION}/`);
}
