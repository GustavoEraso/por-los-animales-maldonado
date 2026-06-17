'use client';

import { useEffect, useState } from 'react';
import { SponsorType, CarouselType, CarouselsConfigType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import Image from 'next/image';
import { EditIcon, TrashIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { handlePromiseToast } from '@/lib/handleToast';
import { deleteImage } from '@/lib/deleteIgame';
import Link from 'next/link';

import ProtectedRoute from '@/components/ProtectedRoute';
import { revalidateCache } from '@/lib/revalidateCache';
import { logger } from '@/lib/logger';

/**
 * Admin page for managing sponsors and carousels.
 */
export default function PlamAdminSponsors() {
  const [sponsors, setSponsors] = useState<SponsorType[]>([]);
  const [carousels, setCarousels] = useState<CarouselType[]>([]);
  const [carouselsConfig, setCarouselsConfig] = useState<CarouselsConfigType>({});
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(new Set());

  const toggleExpandedPlace = (place: string) => {
    setExpandedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(place)) next.delete(place);
      else next.add(place);
      return next;
    });
  };

  const fetchData = async () => {
    const [sponsorsRes, carouselsRes, configRes] = await Promise.all([
      getFirestoreData({ currentCollection: 'sponsors' }),
      getFirestoreData({ currentCollection: 'carousels' }),
      getFirestoreDocById<CarouselsConfigType>({
        currentCollection: 'config',
        id: 'carouselsConfig',
      }),
    ]);
    setSponsors(sponsorsRes.sort((a, b) => a.name.localeCompare(b.name)));
    setCarousels(carouselsRes);
    if (configRes) setCarouselsConfig(configRes);
  };

  useEffect(() => {
    const load = async () => {
      const [sponsorsRes, carouselsRes, configRes] = await Promise.all([
        getFirestoreData({ currentCollection: 'sponsors' }),
        getFirestoreData({ currentCollection: 'carousels' }),
        getFirestoreDocById<CarouselsConfigType>({
          currentCollection: 'config',
          id: 'carouselsConfig',
        }),
      ]);
      setSponsors(sponsorsRes.sort((a, b) => a.name.localeCompare(b.name)));
      setCarousels(carouselsRes);
      if (configRes) setCarouselsConfig(configRes);
    };
    load();
  }, []);

  const handleDeleteSponsor = async (sponsorId: string) => {
    const current = sponsors.find((s) => s.id === sponsorId);
    if (!current) return;

    // Build updated carousels removing the deleted sponsor from all sponsorIds
    const affectedCarousels = carousels
      .filter((c) => c.sponsorIds.includes(sponsorId))
      .map((c) => ({ ...c, sponsorIds: c.sponsorIds.filter((id) => id !== sponsorId) }));

    try {
      await handlePromiseToast(
        Promise.all([
          deleteImage(current.image.imgId),
          deleteFirestoreData({ collection: 'sponsors', docId: sponsorId }),
          ...affectedCarousels.map((c) =>
            postFirestoreData<CarouselType>({ data: c, currentCollection: 'carousels', id: c.id })
          ),
        ]),
        {
          messages: {
            pending: { title: 'Eliminando sponsor', text: 'Borrando el sponsor...' },
            success: { title: 'Sponsor eliminado', text: 'El sponsor se eliminó correctamente' },
            error: { title: 'Error', text: 'No se pudo eliminar el sponsor' },
          },
        }
      );
      await revalidateCache('sponsors');
      await fetchData();
    } catch (error) {
      logger({ level: 'error', code: 'DELETE_SPONSOR_ERROR', message: 'Error deleting sponsor:', data: error });
    }
  };

  const handleToggleCarousel = async (carousel: CarouselType) => {
    const updated: CarouselType = { ...carousel, active: !carousel.active };
    setCarousels((prev) => prev.map((c) => (c.id === carousel.id ? updated : c)));
    try {
      await handlePromiseToast(
        postFirestoreData<CarouselType>({
          data: updated,
          currentCollection: 'carousels',
          id: carousel.id,
        }),
        {
          messages: {
            pending: { title: 'Actualizando...', text: 'Guardando cambio...' },
            success: {
              title: updated.active ? 'Carrusel activado' : 'Carrusel desactivado',
              text: `"${carousel.name}" fue ${updated.active ? 'activado' : 'desactivado'}`,
            },
            error: { title: 'Error', text: 'No se pudo actualizar el carrusel' },
          },
        }
      );
      await revalidateCache('sponsors');
    } catch (error) {
      logger({ level: 'error', code: 'TOGGLE_CAROUSEL_ERROR', message: 'Error toggling carousel:', data: error });
      setCarousels((prev) => prev.map((c) => (c.id === carousel.id ? carousel : c)));
    }
  };

  const handleUpdatePlacement = async (updated: CarouselsConfigType) => {
    setCarouselsConfig(updated);
    try {
      await postFirestoreData<CarouselsConfigType>({
        data: updated,
        currentCollection: 'config',
        id: 'carouselsConfig',
      });
      await revalidateCache('sponsors');
    } catch (error) {
      logger({ level: 'error', code: 'UPDATE_PLACEMENTS_ERROR', message: 'Error updating placements:', data: error });
      await fetchData();
    }
  };

  const handleAddToPlace = (place: string, carouselId: string) => {
    if (!carouselId || (carouselsConfig[place] ?? []).includes(carouselId)) return;
    handleUpdatePlacement({
      ...carouselsConfig,
      [place]: [...(carouselsConfig[place] ?? []), carouselId],
    });
  };

  const handleRemoveFromPlace = (place: string, carouselId: string) => {
    handleUpdatePlacement({
      ...carouselsConfig,
      [place]: (carouselsConfig[place] ?? []).filter((id) => id !== carouselId),
    });
  };

  const handleReorderInPlace = (place: string, index: number, dir: 'up' | 'down') => {
    const ids = [...(carouselsConfig[place] ?? [])];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    handleUpdatePlacement({ ...carouselsConfig, [place]: ids });
  };

  const handleDeleteCarousel = async (carouselId: string) => {
    try {
      // Build updated config removing the deleted carousel from all places
      const cleanedConfig = Object.fromEntries(
        Object.entries(carouselsConfig).map(([place, ids]) => [
          place,
          ids.filter((id) => id !== carouselId),
        ])
      );

      await handlePromiseToast(
        Promise.all([
          deleteFirestoreData({ collection: 'carousels', docId: carouselId }),
          postFirestoreData<CarouselsConfigType>({
            data: cleanedConfig,
            currentCollection: 'config',
            id: 'carouselsConfig',
          }),
        ]),
        {
          messages: {
            pending: { title: 'Eliminando carrusel...', text: 'Por favor espera...' },
            success: { title: 'Carrusel eliminado', text: 'El carrusel se eliminó correctamente' },
            error: { title: 'Error', text: 'No se pudo eliminar el carrusel' },
          },
        }
      );
      await revalidateCache('sponsors');
      setCarouselsConfig(cleanedConfig);
      await fetchData();
    } catch (error) {
      logger({ level: 'error', code: 'DELETE_CAROUSEL_ERROR', message: 'Error deleting carousel:', data: error });
    }
  };

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex flex-col min-h-screen p-4 md:px-16 pb-24 gap-8">
        {/* ── Placements ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div>
            <h2 className="text-xl font-bold text-green-dark">Ubicaciones</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Define qué carruseles aparecen en cada página y en qué orden
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Filled places — full card grid */}
            {Object.entries(carouselsConfig).filter(([, ids]) => ids.length > 0).length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(carouselsConfig)
                  .filter(([, ids]) => ids.length > 0)
                  .map(([place, ids]) => {
                    const available = carousels.filter((c) => !ids.includes(c.id));
                    return (
                      <div
                        key={place}
                        className="flex flex-col gap-2 bg-gray-50 rounded-lg border border-gray-200 p-4"
                      >
                        <h3 className="font-semibold text-sm text-green-dark capitalize">
                          {place}
                        </h3>
                        <ol className="flex flex-col gap-1.5">
                          {ids.map((id, index) => {
                            const c = carousels.find((x) => x.id === id);
                            return (
                              <li
                                key={id}
                                className="flex items-center gap-2 bg-white rounded border border-gray-200 px-2 py-1.5"
                              >
                                <span className="w-5 h-5 text-xs font-bold text-gray-400 shrink-0 text-center">
                                  {index + 1}
                                </span>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    c?.active ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                />
                                <span className="flex-1 text-sm truncate">{c?.name ?? id}</span>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => handleReorderInPlace(place, index, 'up')}
                                    disabled={index === 0}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={() => handleReorderInPlace(place, index, 'down')}
                                    disabled={index === ids.length - 1}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    onClick={() => handleRemoveFromPlace(place, id)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-xs"
                                    title="Quitar de esta página"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                        {available.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              handleAddToPlace(place, e.target.value);
                              e.target.value = '';
                            }}
                            className="mt-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-forest"
                          >
                            <option value="" disabled>
                              + Agregar carrusel
                            </option>
                            {available.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Empty places — collapsed accordion rows */}
            {Object.entries(carouselsConfig).filter(([, ids]) => ids.length === 0).length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 pb-0.5">
                  Páginas sin carruseles
                </p>
                {Object.entries(carouselsConfig)
                  .filter(([, ids]) => ids.length === 0)
                  .map(([place]) => {
                    const isOpen = expandedPlaces.has(place);
                    return (
                      <div
                        key={place}
                        className="rounded-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpandedPlace(place)}
                          className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-400 capitalize">
                            {place}
                          </span>
                          <span className="text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div className="px-4 py-3 flex flex-col gap-2 bg-white">
                            {carousels.length > 0 ? (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  handleAddToPlace(place, e.target.value);
                                  e.target.value = '';
                                }}
                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-forest"
                              >
                                <option value="" disabled>
                                  + Agregar carrusel
                                </option>
                                {carousels.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-gray-400 text-center py-1">
                                No hay carruseles creados todavía
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        {/* ── Carousels ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-green-dark">Carruseles</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Cada carrusel tiene su propia lista de sponsors, dirección y velocidad
              </p>
            </div>
            <Link
              href="/plam-admin/sponsors/carruseles/crear"
              className="flex items-center gap-2 px-4 py-2 bg-green-forest text-white rounded-lg hover:bg-green-dark transition-colors text-sm font-semibold"
            >
              + Nuevo carrusel
            </Link>
          </div>

          {carousels.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {carousels.map((carousel) => {
                const sponsorCount = carousel.sponsorIds?.length ?? 0;
                return (
                  <li
                    key={carousel.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-3 flex-wrap"
                  >
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleCarousel(carousel)}
                      title={carousel.active ? 'Desactivar carrusel' : 'Activar carrusel'}
                      className={`w-10 h-6 rounded-full shrink-0 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-green-forest ${
                        carousel.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          carousel.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-green-dark truncate">{carousel.name}</p>
                      <p className="text-xs text-gray-400">
                        {carousel.direction === 'normal' ? '→ Normal' : '← Invertido'} · vel.{' '}
                        {carousel.speed} · {sponsorCount}{' '}
                        {sponsorCount === 1 ? 'sponsor' : 'sponsors'}
                      </p>
                    </div>

                    {/* Sponsor thumbnails */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {carousel.sponsorIds?.slice(0, 5).map((id) => {
                        const s = sponsors.find((sp) => sp.id === id);
                        return s ? (
                          <div
                            key={id}
                            className="w-7 h-7 rounded border border-gray-200 bg-white overflow-hidden flex items-center justify-center"
                          >
                            <Image
                              src={s.image.imgUrl}
                              alt={s.name}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          </div>
                        ) : null;
                      })}
                      {sponsorCount > 5 && (
                        <span className="text-xs text-gray-400">+{sponsorCount - 5}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/plam-admin/sponsors/carruseles/editar/${carousel.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <EditIcon size={14} />
                        <span className="hidden sm:inline">Editar</span>
                      </Link>
                      <Modal
                        buttonText={<TrashIcon size={14} />}
                        buttonStyles="flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <div className="flex flex-col gap-4 p-6 bg-cream-light min-h-full">
                          <h3 className="text-xl font-bold text-red-600">Eliminar carrusel</h3>
                          <p className="text-gray-600 text-sm">
                            ¿Eliminar <strong>{carousel.name}</strong>? Esta acción no se puede
                            deshacer.
                          </p>
                          <button
                            onClick={() => handleDeleteCarousel(carousel.id)}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                          >
                            Sí, eliminar
                          </button>
                        </div>
                      </Modal>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">
              No hay carruseles todavía. Creá el primero con el botón de arriba.
            </p>
          )}
        </section>

        {/* ── Sponsors master catalog ────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold">Sponsors</h1>
              {sponsors.length > 0 && (
                <span className="text-sm text-gray-500 font-medium">
                  {sponsors.length} {sponsors.length === 1 ? 'sponsor' : 'sponsors'}
                </span>
              )}
            </div>
            <Link
              href="/plam-admin/sponsors/crear"
              className="flex items-center gap-2 px-4 py-2 bg-green-forest text-white rounded-lg hover:bg-green-dark transition-colors text-sm font-semibold"
            >
              + Nuevo sponsor
            </Link>
          </div>

          {sponsors.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {sponsors.map((sponsor) => (
                <li
                  key={sponsor.id}
                  className="flex items-center gap-2 sm:gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
                >
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
                          className="text-xs text-blue-500 hover:underline truncate hidden md:block"
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
                              Esta acción eliminará el sponsor y su imagen de Cloudinary. No se
                              puede deshacer.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSponsor(sponsor.id)}
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
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
              <span className="text-5xl">🤝</span>
              <p className="text-lg font-medium">No hay sponsors todavía</p>
              <p className="text-sm">
                Usá el botón &quot;+ Nuevo sponsor&quot; para agregar el primero
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
