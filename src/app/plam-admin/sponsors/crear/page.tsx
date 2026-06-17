'use client';

import { useState } from 'react';
import { SponsorType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import Loader from '@/components/Loader';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { useRouter } from 'next/navigation';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import { revalidateCache } from '@/lib/revalidateCache';
import { logger } from '@/lib/logger';

const initialSponsor: SponsorType = {
  id: '',
  name: '',
  href: '',
  image: { imgId: '', imgUrl: '', imgAlt: '' },
};

/**
 * Admin page for creating a new sponsor.
 * Allows uploading a logo image and entering a sponsor name and optional link.
 */
export default function CreateSponsorForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sponsor, setSponsor] = useState<SponsorType>(initialSponsor);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSponsor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const MIN_LOADING_TIME = 600;
    const start = Date.now();

    try {
      setLoading(true);

      if (!sponsor.image.imgUrl) {
        return handleToast({
          type: 'warning',
          title: 'Error',
          text: 'No se subió ninguna imagen.',
        });
      }

      const id = sponsor.image.imgId;
      if (!id) {
        return handleToast({
          type: 'error',
          title: 'Error',
          text: 'Hubo un error, si el problema persiste contacta al administrador.',
        });
      }

      if (!sponsor.name.trim()) {
        return handleToast({ type: 'warning', title: 'Error', text: 'El nombre es requerido.' });
      }

      const newSponsor: SponsorType = { ...sponsor, id };

      await handlePromiseToast(
        postFirestoreData<SponsorType>({ data: newSponsor, currentCollection: 'sponsors', id }),
        {
          messages: {
            pending: { title: 'Guardando sponsor...', text: 'Por favor espera...' },
            success: {
              title: 'Sponsor creado',
              text: 'En 10 minutos podrás verlo en la página principal',
            },
            error: {
              title: 'Error al crear el sponsor',
              text: 'Hubo un error al crear el sponsor',
            },
          },
        }
      );

      setSponsor(initialSponsor);
      await revalidateCache('sponsors');
      router.replace('/plam-admin/sponsors');
    } catch (error) {
      logger({ level: 'error', code: 'SAVE_SPONSOR_ERROR', message: 'Error al guardar el sponsor:', data: error });
      setLoading(false);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
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
    setSponsor((prev) => ({ ...prev, image: { imgId: '', imgUrl: '', imgAlt: '' } }));
  };

  if (loading) return <Loader />;

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <h1 className="text-4xl font-bold">Nuevo Sponsor</h1>
        <p>Agregá un nuevo sponsor al carrusel de la página principal.</p>
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-4 max-w-xl w-full"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-semibold">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={sponsor.name}
              onChange={handleChange}
              placeholder="Ej: Raciones La Coronilla"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="href" className="font-semibold">
              Link (opcional)
            </label>
            <input
              id="href"
              name="href"
              type="url"
              value={sponsor.href ?? ''}
              onChange={handleChange}
              placeholder="https://www.instagram.com/..."
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <section className="w-full flex flex-wrap gap-4 items-center justify-center">
            {sponsor.image.imgUrl ? (
              <div className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleImageDelete(sponsor.image.imgId)}
                  className="bg-white rounded-full w-8 h-8 absolute top-1 right-1 shadow z-10"
                >
                  ✕
                </button>
                <Image
                  src={sponsor.image.imgUrl}
                  alt={sponsor.image.imgAlt}
                  width={200}
                  height={200}
                  className="object-contain rounded-lg border"
                />
              </div>
            ) : (
              <UploadImages
                currentFolder="sponsor"
                maxFiles={1}
                onImagesAdd={(imgs) => {
                  if (imgs[0]) {
                    setSponsor((prev) => ({
                      ...prev,
                      image: { ...imgs[0], imgAlt: `${prev.name || 'sponsor'} logo` },
                    }));
                  }
                }}
              />
            )}
          </section>

          <button
            type="submit"
            className="bg-green-forest text-white px-6 py-3 rounded-lg hover:bg-green-dark transition-colors font-semibold"
          >
            Guardar sponsor
          </button>
        </form>
      </section>
    </ProtectedRoute>
  );
}
