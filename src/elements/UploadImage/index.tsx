
'use client';

import React from 'react';
import { CldUploadWidget,} from 'next-cloudinary';
import type {
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetInfo,
} from 'next-cloudinary';
import { Img } from '@/types';

/**
 * Props for the UploadImages component.
 */
interface UploadImagesProps {
  /** Callback function called when images are successfully uploaded */
  onImagesAdd: (images: Img[]) => void;
  /** Maximum number of files that can be uploaded (default: 5) */
  maxFiles?: number;
}

/**
 * Image upload component using Cloudinary that handles multiple image uploads.
 * Automatically converts images to WebP format for better performance and handles
 * the upload process with proper error handling and UI feedback.
 * 
 * @param {UploadImagesProps} props - Component props
 * @param {function} props.onImagesAdd - Callback function called when images are successfully uploaded
 * @param {number} [props.maxFiles=5] - Maximum number of files that can be uploaded
 * @returns {React.ReactElement} Upload widget with button and file limits display
 * 
 * @example
 * ```tsx
 * // Basic usage with callback
 * const [images, setImages] = useState<Img[]>([]);
 * 
 * const handleImagesAdd = (newImages: Img[]) => {
 *   setImages(prev => [...prev, ...newImages]);
 * };
 * 
 * <UploadImages onImagesAdd={handleImagesAdd} />
 * 
 * // Custom file limit
 * <UploadImages 
 *   onImagesAdd={handleImagesAdd} 
 *   maxFiles={3} 
 * />
 * 
 * // In a form for animal registration
 * <form className="space-y-6">
 *   <div>
 *     <label>Fotos del animal</label>
 *     <UploadImages 
 *       onImagesAdd={handleAnimalImages}
 *       maxFiles={5}
 *     />
 *   </div>
 * </form>
 * 
 * // With image preview
 * <div className="upload-section">
 *   <UploadImages onImagesAdd={handleImagesAdd} />
 *   <div className="image-grid mt-4">
 *     {images.map(img => (
 *       <img key={img.imgId} src={img.imgUrl} alt={img.imgAlt} />
 *     ))}
 *   </div>
 * </div>
 * ```
 * 
 * @note Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET environment variable.
 * Images are automatically optimized to WebP format when available.
 */
export default function UploadImages({onImagesAdd, maxFiles}: UploadImagesProps): React.ReactElement {


const handleUpload = (result: CloudinaryUploadWidgetResults) => {
  if (result.event === 'success' && typeof result.info !== 'string' && result.info) {
    const info = result.info as CloudinaryUploadWidgetInfo;
    const { secure_url, public_id , eager } = info;

    const eagerArray = eager as Array<{ format: string; secure_url: string }>;

    const webpUrl =
      eagerArray && eagerArray.length > 0
        ? eagerArray.find((img) => img.format === 'webp')?.secure_url || secure_url
        : secure_url;

        console.log('Uploaded image URL:', webpUrl);
    onImagesAdd([{ imgUrl: webpUrl, imgId: public_id, imgAlt: 'animal image' }]);

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
        uploadPreset= {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET! || ''}
        options={{ multiple: true, maxFiles: maxFiles || 5 }}
        onSuccess={handleUpload}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open?.()}
            className="bg-caramel-deep text-white px-4 py-2 rounded hover:bg-amber-sunset"
          >
            Subir imágenes
          </button>
        )}
      </CldUploadWidget>

    </section>
  );
}
