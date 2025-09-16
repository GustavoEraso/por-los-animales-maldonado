
'use client';

import { CldUploadWidget,} from 'next-cloudinary';
import type {
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetInfo,
} from 'next-cloudinary';
import { Img } from '@/types';

interface UploadImagesProps {
 onImagesAdd: (images: Img[]) => void;
  maxFiles?: number,

}
export default function UploadImages({onImagesAdd, maxFiles}: UploadImagesProps) {


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
