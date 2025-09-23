import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/cloudinary';

/**
 * DELETE /api/delete-image - Delete image from Cloudinary storage
 *
 * Internal API endpoint that deletes images from Cloudinary using the public ID.
 * This endpoint is protected with an internal token for security and is used
 * when removing animal images or other uploaded content from the system.
 *
 * @param {NextRequest} req - Request object containing query parameters and headers
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @query {string} publicId - Cloudinary public ID of the image to delete
 *
 * @returns {NextResponse<{success: true, result: any}>} Success response with Cloudinary result
 * @returns {NextResponse<{error: string}>} 401 error if token is invalid or missing
 * @returns {NextResponse<{error: string}>} 400 error if publicId is missing
 * @returns {NextResponse<{error: string}>} 500 error if deletion fails or internal error
 *
 * @example
 * ```typescript
 * // Delete an animal image during cleanup
 * const response = await fetch('/api/delete-image?publicId=animal_photos/abc123', {
 *   method: 'DELETE',
 *   headers: {
 *     'x-internal-token': process.env.INTERNAL_API_SECRET!
 *   }
 * });
 *
 * if (response.ok) {
 *   const result = await response.json();
 *   console.log('Image deleted successfully:', result.success);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Usage in admin panel for bulk image cleanup
 * const deleteImages = async (publicIds: string[]) => {
 *   const results = await Promise.all(
 *     publicIds.map(id =>
 *       fetch(`/api/delete-image?publicId=${id}`, {
 *         method: 'DELETE',
 *         headers: { 'x-internal-token': process.env.INTERNAL_API_SECRET! }
 *       })
 *     )
 *   );
 *   return results.map(r => r.ok);
 * };
 * ```
 *
 * @note This is an internal API endpoint requiring authentication.
 * Used for cleaning up images when animals are deleted or images are replaced.
 * Cloudinary public IDs must be exact matches for successful deletion.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');
    const token = req.headers.get('x-internal-token');

    if (token !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
