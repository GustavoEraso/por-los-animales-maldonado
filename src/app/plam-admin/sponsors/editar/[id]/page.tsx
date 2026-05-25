'use client';

import { useEffect, useState } from 'react';
import { SponsorType } from '@/types';
import UploadImages from '@/elements/UploadImage';
import { deleteImage } from '@/lib/deleteIgame';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { useRouter, useParams } from 'next/navigation';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import Loader from '@/components/Loader';
import { getChangedFields } from '@/lib/getChangedFields';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import { revalidateCache } from '@/lib/revalidateCache';

const initialSponsor: SponsorType = {
  id: '',
  name: '',
  href: '',
  image: { imgId: '', imgUrl: '', imgAlt: '' },
};

/**
 * Admin page for editing an existing sponsor.
 * Fetches sponsor data by ID and allows updating name, link, and logo image.
 */
export default function EditSponsorForm() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const MIN_LOADING_TIME = 600;

  const [oldSponsor, setOldSponsor] = useState<SponsorType>(initialSponsor);
  const [sponsor, setSponsor] = useState<SponsorType>(initialSponsor);

  useEffect(() => {
    const start = Date.now();
    const fetchSponsorData = async () => {
      try {
        if (!currentId) return;
        const fetched = await getFirestoreDocById<SponsorType>({
          currentCollection: 'sponsors',
          id: currentId,
        });
        if (!fetched) {
          console.error('Sponsor not found');
          throw new Error('Sponsor not found');
        }
        setOldSponsor(structuredClone(fetched));
        setSponsor(fetched);
      } catch (error) {
        console.error('Error fetching sponsor data:', error);
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Hubo un error al obtener los datos del sponsor',
        });
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setIsLoading(false), remaining);
        } else {
          setIsLoading(false);
        }
      }
    };
    fetchSponsorData();
  }, [currentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSponsor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sponsor.image.imgUrl) {
      return handleToast({ type: 'warning', title: 'Error', text: 'No se subió ninguna imagen.' });
    }

    if (!sponsor.name.trim()) {
      return handleToast({ type: 'warning', title: 'Error', text: 'El nombre es requerido.' });
    }

    const changes = getChangedFields({ oldObj: oldSponsor, newObj: sponsor });
    if (Object.keys(changes).length === 0) {
      handleToast({
        type: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios para guardar.',
      });
      return;
    }

    try {
      await handlePromiseToast(
        postFirestoreData<SponsorType>({
          data: sponsor,
          currentCollection: 'sponsors',
          id: sponsor.id,
        }),
        {
          messages: {
            pending: { title: 'Guardando cambios...', text: 'Por favor espera...' },
            success: {
              title: 'Sponsor actualizado',
              text: 'Los cambios se guardaron correctamente',
            },
            error: { title: 'Error', text: 'Hubo un error al guardar los cambios' },
          },
        }
      );

      await revalidateCache('sponsors');
      router.replace('/plam-admin/sponsors');
    } catch (error) {
      console.error('Error al actualizar el sponsor:', error);
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

  if (isLoading) return <Loader />;

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <section className="flex flex-col gap-6 justify-center items-center p-8 lg:px-32 w-full">
        <h1 className="text-4xl font-bold">Editar Sponsor</h1>
        <p>Modificá los datos del sponsor.</p>
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
            Guardar cambios
          </button>
        </form>
      </section>
    </ProtectedRoute>
  );
}
