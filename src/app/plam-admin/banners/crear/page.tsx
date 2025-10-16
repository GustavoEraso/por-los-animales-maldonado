'use client';
import { useState } from 'react';
import { BannerType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import Loader from '@/components/Loader';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { useRouter } from 'next/navigation';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { PlusIcon } from '@/components/Icons';
import Image from 'next/image';

const initialBanner: BannerType = {
  id: '',
  title: '',
  description: '',
  showTitle: false,
  showDescription: false,
  showButton: false,
  buttonText: '',
  buttonUrl: '',
  image: { imgId: '', imgUrl: '', imgAlt: '' },
};

export default function CreateAnimalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<BannerType>(initialBanner);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setBanner((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const MIN_LOADING_TIME = 600;
    const start = Date.now();
    try {
      setLoading(true);

      if (!banner.image.imgUrl)
        return handleToast({
          type: 'warning',
          title: 'Error',
          text: 'No se subió ninguna imagen.',
        });
      const id = banner.image?.imgId || '';
      if (!id)
        return handleToast({
          type: 'error',
          title: 'Error',
          text: 'hubo un error, si el problema persiste contacta al administrador.',
        });

      const newBanner: BannerType = {
        ...banner,
        id: id,
      };

      const promises = Promise.all([
        postFirestoreData<BannerType>({ data: newBanner, currentCollection: 'banners', id }),
      ]);

      await handlePromiseToast(promises, {
        messages: {
          pending: {
            title: `Subiendo a banner...`,
            text: `Por favor espera mientras creamos el banner...`,
          },
          success: {
            title: `Banner creado`,
            text: `En 10 minutos podras verlo en la página principal`,
          },
          error: {
            title: `Hubo un error al crear el banner`,
            text: `Hubo un error al crear el banner`,
          },
        },
      });
      router.replace('/plam-admin/banners');
    } catch (error) {
      console.error('Error al guardar el banner:', error);
      setLoading(false);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;

      if (remaining > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      } else {
        setLoading(false);
      }
    }
  };

  const handleImageDelete = async (imgId: string) => {
    await handlePromiseToast(deleteImage(imgId), {
      messages: {
        pending: { title: 'Eliminando imagen...', text: 'Por favor espera...' },
        success: { title: 'Imagen eliminada', text: 'La imagen fue eliminada exitosamente' },
        error: { title: 'Error', text: 'Hubo un error al eliminar la imagen' },
      },
    });

    setBanner((prev) => ({ ...prev, image: { imgId: '', imgUrl: '', imgAlt: '' } }));
  };

  return (
    <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
      <h1 className="text-4xl font-bold">Nuevo Banner</h1>
      <p>sube un nuevo banner.</p>
      <section className="w-full  "></section>
      <form
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
        }}
        autoComplete="off"
        className="flex flex-col gap-4 max-w-xl w-full"
      >
        <section className="w-full flex flex-wrap gap-4 items-center justify-center">
          {banner.image.imgUrl && (
            <div key={banner.image.imgId} className="relative flex flex-col items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleImageDelete(banner.image.imgId);
                }}
                className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow"
              >
                X
              </button>
              <Image
                src={banner.image.imgUrl}
                alt={banner.image.imgAlt}
                className="object-cover rounded-lg w-full aspect-[21/9]"
                width={600}
                height={257}
              />
              <span className="text-sm text-gray-500">{banner.image.imgId}</span>
            </div>
          )}
        </section>

        {!banner.image.imgUrl && (
          <UploadImages
            currentFolder="banners"
            maxFiles={1}
            onImagesAdd={(imgs) => {
              if (imgs.length > 0) setBanner({ ...banner, image: imgs[0] });
            }}
          />
        )}

        <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
          <span>Mostar Titulo:</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={banner.showTitle}
            name="showTitle"
            onChange={(e) => setBanner({ ...banner, showTitle: e.target.checked })}
          />
          <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
        </label>

        {banner.showTitle && (
          <label className="flex flex-col font-bold gap-1">
            Titulo:
            <input
              className="outline-2 bg-white outline-gray-200 rounded p-2"
              type="text"
              name="title"
              value={banner.title}
              onChange={handleChange}
              required
            />
          </label>
        )}

        <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
          <span>Mostar descripcion:</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={banner.showDescription}
            name="showDescription"
            onChange={(e) => setBanner({ ...banner, showDescription: e.target.checked })}
          />
          <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
        </label>

        {banner.showDescription && (
          <label className="flex flex-col font-bold gap-1">
            Descripción:
            <textarea
              className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
              name="description"
              value={banner.description}
              onChange={handleChange}
            />
          </label>
        )}

        <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
          <span>Mostar Boton:</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={banner.showButton}
            name="showButton"
            onChange={(e) => setBanner({ ...banner, showButton: e.target.checked })}
          />
          <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-cream-light   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
        </label>
        {banner.showButton && (
          <>
            <label className="flex flex-col font-bold gap-1">
              Texto del boton:
              <input
                className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
                type="text"
                name="buttonText"
                value={banner.buttonText}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col font-bold gap-1">
              URL del boton:
              <input
                className="outline-2  bg-white outline-gray-200 rounded p-2 field-sizing-content"
                type="text"
                name="buttonUrl"
                value={banner.buttonUrl}
                onChange={handleChange}
              />
            </label>
          </>
        )}

        <small className="text-gray-500">
          *El banner aparecerá en la página principal en unos 10 minutos.
        </small>

        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusIcon size={20} title="Publicar banner" color="white" />
          Publicar banner
        </button>
      </form>
      {loading && <Loader />}
    </section>
  );
}
