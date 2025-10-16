'use client';

import React from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import type { CloudinaryUploadWidgetResults, CloudinaryUploadWidgetInfo } from 'next-cloudinary';
import { Img } from '@/types';
import { UploadIcon } from '@/components/Icons';

/**
 * Props for the UploadImages component.
 */
interface UploadImagesProps {
  /** Callback function called when images are successfully uploaded */
  onImagesAdd: (images: Img[]) => void;
  /** Maximum number of files that can be uploaded (default: 5) */
  maxFiles?: number;
  /** Current folder in Cloudinary to upload images to */
  currentFolder?: 'animals' | 'banners' | 'others';
}

/**
 * Image upload component using Cloudinary that handles multiple image uploads.
 * Automatically converts images to WebP format for better performance and handles
 * the upload process with proper error handling and UI feedback.
 *
 * @param {UploadImagesProps} props - Component props
 * @param {function} props.onImagesAdd - Callback function called when images are successfully uploaded with Img[] format
 * @param {number} [props.maxFiles=5] - Maximum number of files that can be uploaded
 * @param {'animals'|'banners'|'others'} [props.currentFolder='animals'] - Cloudinary folder/preset to use for uploads
 * @returns {React.ReactElement} Upload widget with button and file limits display
 *
 * @example
 * ```tsx
 * // Basic usage for animal images
 * const [images, setImages] = useState<Img[]>([]);
 *
 * const handleImagesAdd = (newImages: Img[]) => {
 *   setImages(prev => [...prev, ...newImages]);
 * };
 *
 * <UploadImages
 *   onImagesAdd={handleImagesAdd}
 *   currentFolder="animals"
 * />
 *
 * // Upload banner images with custom limit
 * <UploadImages
 *   onImagesAdd={handleBannerUpload}
 *   currentFolder="banners"
 *   maxFiles={1}
 * />
 *
 * // In a form for animal registration
 * <form className="space-y-6">
 *   <div>
 *     <label>Fotos del animal</label>
 *     <UploadImages
 *       onImagesAdd={handleAnimalImages}
 *       currentFolder="animals"
 *       maxFiles={5}
 *     />
 *   </div>
 * </form>
 *
 * // With image preview grid
 * <div className="upload-section">
 *   <UploadImages onImagesAdd={handleImagesAdd} />
 *   <div className="image-grid mt-4 grid grid-cols-3 gap-4">
 *     {images.map(img => (
 *       <div key={img.imgId} className="relative aspect-square">
 *         <img
 *           src={img.imgUrl}
 *           alt={img.imgAlt}
 *           className="w-full h-full object-cover rounded-lg"
 *         />
 *       </div>
 *     ))}
 *   </div>
 * </div>
 * ```
 *
 * @note Requires environment variables:
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_ANIMALS
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_BANNERS
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_OTHERS
 *
 * Images are automatically optimized to WebP format when available.
 * Uploaded images return an Img object with: { imgUrl, imgId, imgAlt }
 */
export default function UploadImages({
  currentFolder = 'animals',
  onImagesAdd,
  maxFiles,
}: UploadImagesProps): React.ReactElement {
  const presetMap: { [key: string]: string } = {
    animals: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_ANIMALS || '',
    banners: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_BANNERS || '',
    others: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_OTHERS || '',
  };

  const uploadPreset = presetMap[currentFolder] || presetMap['others'];

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === 'success' && typeof result.info !== 'string' && result.info) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      const { secure_url, public_id, eager } = info;

      // Find WebP version or fallback to original
      let webpUrl = secure_url;
      if (eager && Array.isArray(eager) && eager.length > 0) {
        const webpImage = eager.find((img) => img.format === 'webp');
        if (webpImage?.secure_url) {
          webpUrl = webpImage.secure_url;
        }
      }

      // Ensure URL doesn't have line breaks or extra whitespace
      const cleanUrl = webpUrl.trim().replace(/\s+/g, '');

      console.log('Uploaded image URL:', cleanUrl);
      onImagesAdd([{ imgUrl: cleanUrl, imgId: public_id, imgAlt: 'animal image' }]);

      // Reset body overflow after upload modal closes
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.position = '';
      }, 100);
    }
  };

  return (
    <section className="flex flex-col gap-6 justify-center items-center w-full">
      <span className="text-xl font-bold">maximo 5 imagenes</span>
      <CldUploadWidget
        uploadPreset={uploadPreset}
        options={{ multiple: true, maxFiles: maxFiles || 5 }}
        onSuccess={handleUpload}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open?.()}
            className="bg-caramel-deep text-white px-4 py-2 rounded hover:bg-amber-sunset flex items-center gap-2"
          >
            <UploadIcon size={20} title="Subir imágenes" color="white" />
            Subir imágenes
          </button>
        )}
      </CldUploadWidget>
    </section>
  );
}
