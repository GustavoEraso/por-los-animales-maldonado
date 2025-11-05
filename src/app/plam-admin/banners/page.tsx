'use client';

import { useEffect, useState } from 'react';
import { BannerType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import Image from 'next/image';
import { EditIcon, TrashIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { handlePromiseToast } from '@/lib/handleToast';
import { deleteImage } from '@/lib/deleteIgame';
import Link from 'next/link';

import FloatButton from '@/elements/FloatButton';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PlamAdminBanners() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerType[]>([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const res = await getFirestoreData({ currentCollection: 'banners' });
    setBanners(res);
  };

  const handleDelete = async (bannerId: string) => {
    const currentBanner = banners.find((b) => b.id === bannerId);
    if (!currentBanner) {
      console.error('Banner not found:', bannerId);
      return;
    }
    const imgId = currentBanner.image.imgId;
    const promises = [
      deleteImage(imgId),
      deleteFirestoreData({
        collection: 'banners',
        docId: bannerId,
      }),
    ];

    try {
      await handlePromiseToast(Promise.all(promises), {
        messages: {
          pending: {
            title: 'Eliminando banner',
            text: 'Borrando el banner...',
          },
          success: {
            title: 'Banner eliminado',
            text: 'El banner se eliminó correctamente',
          },
          error: {
            title: 'Error',
            text: 'No se pudo eliminar el banner',
          },
        },
      });

      await fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex flex-col min-h-screen p-4 md:px-16">
        <h1 className="text-3xl font-bold mb-4">Administrar Banners</h1>
        <section className="flex flex-col gap-6">
          {banners.length > 0 ? (
            banners.map((banner) => (
              <article
                key={banner.id}
                className="flex flex-col md:flex-row gap-4 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="relative w-full md:w-1/3 aspect-[21/9]">
                  <Image
                    src={banner?.image.imgUrl ?? '/logo300.webp'}
                    alt={banner?.image.imgAlt ?? 'Imagen del banner'}
                    className="object-cover rounded-lg w-full aspect-[21/9]"
                    width={600}
                    height={257}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2 text-green-dark uppercase">
                      {banner.title}
                    </h2>
                    <p className="text-gray-700 mb-4">{banner.description}</p>
                    {banner.showButton && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Botón:</span>
                        <span>{banner.buttonText}</span>
                        <span className="text-blue-600">→ {banner.buttonUrl}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/plam-admin/banners/editar/${banner.id}/`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EditIcon size={20} />
                      <span>Editar</span>
                    </Link>
                    <Modal
                      buttonText={
                        <div className="flex items-center gap-2">
                          <TrashIcon size={20} />
                          <span>Eliminar</span>
                        </div>
                      }
                      buttonStyles="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <div className="flex flex-col gap-4 p-4 min-h-full w-full bg-cream-light">
                        <h2 className="text-2xl font-bold text-red-600">Confirmar Eliminación</h2>
                        <div className="relative w-full h-48">
                          <Image
                            src={banner?.image.imgUrl ?? '/logo300.webp'}
                            alt={banner?.image.imgAlt ?? 'Imagen del banner'}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <p className="text-gray-700">
                          ¿Estás seguro de que querés eliminar el banner{' '}
                          <strong>{banner.title}</strong>?
                        </p>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                          Sí, Eliminar
                        </button>
                      </div>
                    </Modal>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-gray-600">No hay banners disponibles.</p>
          )}
        </section>
        <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace('/plam-admin/banners/crear');
          }}
        />
      </main>
    </ProtectedRoute>
  );
}
