export const deleteImage = async (imgId: string) => {
  await fetch(`/api/delete-image?publicId=${imgId}`, {
  method: 'DELETE',
  headers: {
    'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET!,
  },
});
};