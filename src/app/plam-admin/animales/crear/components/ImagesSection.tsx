import { Img } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { FIELD_ERROR_MESSAGES, FormErrors } from '../constants';

interface ImagesSectionProps {
  images: Img[];
  setImages: React.Dispatch<React.SetStateAction<Img[]>>;
  formErrors: FormErrors;
  handleImageDelete: (imgId: string) => Promise<void>;
}

/**
 * Section for displaying uploaded images, deleting them, and uploading new ones.
 * Shows validation errors and limits uploads to 5 images.
 */
export default function ImagesSection({
  images,
  setImages,
  formErrors,
  handleImageDelete,
}: ImagesSectionProps): React.ReactElement {
  return (
    <>
      <section className="flex flex-wrap gap-4 items-center justify-center">
        {images.length > 0 &&
          images.map((img) => (
            <div key={img.imgId} className="relative flex flex-col items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleImageDelete(img.imgId);
                }}
                className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow"
              >
                X
              </button>
              <img
                src={img.imgUrl}
                alt={img.imgAlt}
                className="w-40 h-40 object-cover rounded mb-2"
              />
              <span className="text-sm text-gray-500">{img.imgId}</span>
            </div>
          ))}
      </section>
      {formErrors.images && (
        <div className="bg-red-500 text-white text-sm rounded px-2">
          {FIELD_ERROR_MESSAGES.images}
        </div>
      )}
      {images.length < 5 && (
        <UploadImages
          onImagesAdd={(newImages) => {
            setImages((prev) => [...prev, ...newImages]);
          }}
        />
      )}
    </>
  );
}
