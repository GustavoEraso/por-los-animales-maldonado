'use client';

import { useEffect, useState } from 'react';
import { SponsorType, CarouselType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { useRouter, useParams } from 'next/navigation';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import Image from 'next/image';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { revalidateCache } from '@/lib/revalidateCache';

/**
 * Admin page for editing an existing sponsor carousel.
 * Allows updating sponsors, direction and speed.
 */
export default function EditCarouselPage() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sponsors, setSponsors] = useState<SponsorType[]>([]);

  const [name, setName] = useState('');
  const [direction, setDirection] = useState<'normal' | 'reverse'>('normal');
  const [speed, setSpeed] = useState(15);
  const [active, setActive] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sponsorsRes, carousel] = await Promise.all([
          getFirestoreData({ currentCollection: 'sponsors' }),
          getFirestoreDocById<CarouselType>({ currentCollection: 'carousels', id: currentId }),
        ]);

        setSponsors(sponsorsRes.sort((a, b) => a.name.localeCompare(b.name)));

        if (!carousel) {
          handleToast({ type: 'error', title: 'Error', text: 'No se encontró el carrusel.' });
          router.replace('/plam-admin/sponsors');
          return;
        }

        setName(carousel.name);
        setDirection(carousel.direction);
        setSpeed(carousel.speed);
        setActive(carousel.active);
        setSelectedIds(carousel.sponsorIds ?? []);
      } catch (error) {
        console.error('Error loading carousel:', error);
        handleToast({ type: 'error', title: 'Error', text: 'No se pudieron cargar los datos.' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentId, router]);

  const addSponsor = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeSponsor = (id: string) => {
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setSelectedIds((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      handleToast({
        type: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresá un nombre para el carrusel.',
      });
      return;
    }
    if (selectedIds.length === 0) {
      handleToast({
        type: 'warning',
        title: 'Sin sponsors',
        text: 'Agregá al menos un sponsor al carrusel.',
      });
      return;
    }

    const updated: CarouselType = {
      id: currentId,
      name: name.trim(),
      direction,
      speed,
      sponsorIds: selectedIds,
      active,
    };

    setSaving(true);
    try {
      await handlePromiseToast(
        postFirestoreData<CarouselType>({
          data: updated,
          currentCollection: 'carousels',
          id: currentId,
        }),
        {
          messages: {
            pending: { title: 'Guardando cambios...', text: 'Por favor espera...' },
            success: {
              title: 'Carrusel actualizado',
              text: 'Los cambios se guardaron correctamente',
            },
            error: { title: 'Error', text: 'No se pudo guardar el carrusel' },
          },
        }
      );
      await revalidateCache('sponsors');
      router.replace('/plam-admin/sponsors');
    } catch (error) {
      console.error('Error updating carousel:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loader />;

  const availableSponsors = sponsors.filter((s) => !selectedIds.includes(s.id));

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex flex-col gap-6 p-4 md:px-16 pb-24 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Editar Carrusel</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Nombre del carrusel
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Carrusel principal"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
            />
          </div>

          {/* Direction + speed + active */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Dirección</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  type="button"
                  onClick={() => setDirection('normal')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${direction === 'normal' ? 'bg-green-forest text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  → Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('reverse')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${direction === 'reverse' ? 'bg-green-forest text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                >
                  ← Invertido
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="speed" className="text-sm font-semibold text-gray-700">
                Velocidad
                {speed === 0 ? (
                  <span className="ml-1 font-normal text-amber-600">(estático)</span>
                ) : (
                  ' (seg/ciclo)'
                )}
              </label>
              <input
                id="speed"
                type="number"
                min={0}
                max={60}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-forest"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Estado</span>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-green-forest w-4 h-4"
                />
                <span className="text-sm">{active ? 'Activo' : 'Inactivo'}</span>
              </label>
            </div>
          </div>

          {/* Selected sponsors (ordered) */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Sponsors en este carrusel{' '}
              {selectedIds.length > 0 && (
                <span className="text-gray-400 font-normal">({selectedIds.length})</span>
              )}
            </span>
            {selectedIds.length > 0 ? (
              <ul className="flex flex-col gap-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
                {selectedIds.map((id, index) => {
                  const s = sponsors.find((sp) => sp.id === id);
                  if (!s) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-2"
                    >
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === selectedIds.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-xs"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="w-10 h-10 rounded border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                        <Image
                          src={s.image.imgUrl}
                          alt={s.name}
                          width={40}
                          height={40}
                          className="object-contain w-full h-full p-0.5"
                        />
                      </div>
                      <span className="flex-1 text-sm font-medium text-green-dark truncate">
                        {s.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSponsor(id)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0 px-1"
                        title="Quitar"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                No hay sponsors seleccionados. Agregalos desde la lista de abajo.
              </p>
            )}
          </div>

          {/* Available sponsors */}
          {availableSponsors.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700">Agregar sponsors</span>
              <ul className="flex flex-col gap-2">
                {availableSponsors.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-2"
                  >
                    <div className="w-10 h-10 rounded border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                      <Image
                        src={s.image.imgUrl}
                        alt={s.name}
                        width={40}
                        height={40}
                        className="object-contain w-full h-full p-0.5"
                      />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                      {s.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => addSponsor(s.id)}
                      className="text-sm px-3 py-1 bg-green-forest text-white rounded-lg hover:bg-green-dark transition-colors shrink-0"
                    >
                      + Agregar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-green-forest text-white rounded-lg hover:bg-green-dark transition-colors font-semibold disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </ProtectedRoute>
  );
}
