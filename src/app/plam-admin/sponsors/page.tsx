'use client';

import { useEffect, useState } from 'react';
import { SponsorType } from '@/types';
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
import { revalidateCache } from '@/lib/revalidateCache';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';

/**
 * Admin page for managing sponsors.
 * Displays a sortable list of sponsors with options to reorder, edit, or delete each one.
 */
export default function PlamAdminSponsors() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<SponsorType[]>([]);

  const fetchSponsors = async () => {
    const res = await getFirestoreData({ currentCollection: 'sponsors' });
    setSponsors(res.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSponsors();
  }, []);

  const handleDelete = async (sponsorId: string) => {
    const current = sponsors.find((s) => s.id === sponsorId);
    if (!current) {
      console.error('Sponsor not found:', sponsorId);
      return;
    }

    const promises = [
      deleteImage(current.image.imgId),
      deleteFirestoreData({ collection: 'sponsors', docId: sponsorId }),
    ];

    try {
      await handlePromiseToast(Promise.all(promises), {
        messages: {
          pending: { title: 'Eliminando sponsor', text: 'Borrando el sponsor...' },
          success: { title: 'Sponsor eliminado', text: 'El sponsor se eliminó correctamente' },
          error: { title: 'Error', text: 'No se pudo eliminar el sponsor' },
        },
      });

      await revalidateCache('sponsors');
      await fetchSponsors();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sponsors.length) return;

    const updated = [...sponsors];
    const currentOrder = updated[index].order ?? index;
    const targetOrder = updated[targetIndex].order ?? targetIndex;

    updated[index] = { ...updated[index], order: targetOrder };
    updated[targetIndex] = { ...updated[targetIndex], order: currentOrder };
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    setSponsors(updated);

    try {
      await Promise.all([
        postFirestoreData<SponsorType>({
          data: updated[targetIndex],
          currentCollection: 'sponsors',
          id: updated[targetIndex].id,
        }),
        postFirestoreData<SponsorType>({
          data: updated[index],
          currentCollection: 'sponsors',
          id: updated[index].id,
        }),
      ]);
      await revalidateCache('sponsors');
    } catch (error) {
      console.error('Error reordering sponsors:', error);
      await fetchSponsors();
    }
  };

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex flex-col min-h-screen p-4 md:px-16 pb-24">
        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="text-3xl font-bold">Sponsors</h1>
          {sponsors.length > 0 && (
            <span className="text-sm text-gray-500 font-medium">
              {sponsors.length} {sponsors.length === 1 ? 'sponsor' : 'sponsors'}
            </span>
          )}
        </div>

        {sponsors.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {sponsors.map((sponsor, index) => (
              <li
                key={sponsor.id}
                className="flex items-center gap-2 sm:gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
              >
                {/* Position + arrows */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleReorder(index, 'up')}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-cream-light hover:text-green-dark disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
                    title="Mover arriba"
                  >
                    ▲
                  </button>
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-forest text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => handleReorder(index, 'down')}
                    disabled={index === sponsors.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-cream-light hover:text-green-dark disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
                    title="Mover abajo"
                  >
                    ▼
                  </button>
                </div>
                {/* Logo */}
                <div className="shrink-0 w-16 h-16 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                  <Image
                    src={sponsor.image.imgUrl}
                    alt={sponsor.image.imgAlt}
                    width={64}
                    height={64}
                    className="object-contain w-full h-full p-1"
                  />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-dark truncate">{sponsor.name}</p>
                    {sponsor.href && (
                      <a
                        href={sponsor.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate  hidden md:block"
                      >
                        {sponsor.href}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/plam-admin/sponsors/editar/${sponsor.id}/`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <EditIcon size={16} />
                      <span className="hidden sm:inline">Editar</span>
                    </Link>
                    <Modal
                      buttonText={
                        <div className="flex items-center gap-1.5">
                          <TrashIcon size={16} />
                          <span className="hidden sm:inline">Eliminar</span>
                        </div>
                      }
                      buttonStyles="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      <div className="flex flex-col justify-between items-center gap-4 p-4 w-full min-h-full bg-cream-light">
                        <h2 className="text-xl font-bold text-red-600">Confirmar Eliminación</h2>
                        <div className="w-full flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-4 bg-white rounded-lg p-3 border border-gray-100">
                            <Image
                              src={sponsor.image.imgUrl}
                              alt={sponsor.image.imgAlt}
                              width={64}
                              height={64}
                              className="object-contain rounded w-16 h-16"
                            />
                            <p className="font-semibold text-green-dark">{sponsor.name}</p>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Esta acción eliminará el sponsor y su imagen de Cloudinary. No se puede
                            deshacer.
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(sponsor.id)}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </Modal>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
            <span className="text-5xl">🤝</span>
            <p className="text-lg font-medium">No hay sponsors todavía</p>
            <p className="text-sm">Usá el botón + para agregar el primero</p>
          </div>
        )}

        <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace('/plam-admin/sponsors/crear');
          }}
        />
      </main>
    </ProtectedRoute>
  );
}
