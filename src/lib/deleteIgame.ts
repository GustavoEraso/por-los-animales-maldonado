/**
 * Deletes an image from Cloudinary by its public ID using the internal API route.
 *
 * Sends a DELETE request to the /api/delete-image endpoint with the image public ID.
 * Requires an internal token for authorization, provided in the 'x-internal-token' header.
 * The value for 'x-internal-token' must be set as the environment variable NEXT_PUBLIC_INTERNAL_API_SECRET.
 *
 * @param {string} imgId - The public ID of the image to delete.
 * @returns {Promise<void>} A promise that resolves when the image is deleted.
 *
 * @example
 * // Delete an image with public ID 'sample_image_id'
 * await deleteImage('sample_image_id');
 */

export const deleteImage = async (imgId: string): Promise<void> => {
  await fetch(`/api/delete-image?publicId=${imgId}`, {
    method: 'DELETE',
    headers: {
      'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET!,
    },
  });
};

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

1) Delete an image with public ID 'sample_image_id'
   await deleteImage('sample_image_id');

2) Delete an image and handle errors
   try {
     await deleteImage('my_image_id');
     console.log('Image deleted successfully');
   } catch (error) {
     console.error('Failed to delete image:', error);
   }

──────────────────────────────────────────────────────────────────────────── */
