'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Animal } from '@/types';
import { fetchAnimals } from '@/lib/fetchAnimal';
import { XCircleIcon } from '@/components/Icons';

interface ParentSelectorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when an animal is selected as parent */
  onSelect: (animalId: string, animal?: Animal) => void;
  /** Filter by gender: 'hembra' for mother, 'macho' for father. If omitted, shows all. */
  gender?: 'macho' | 'hembra';
  /** Currently selected animal ID (to highlight) */
  selectedId?: string;
  /** Animal IDs to exclude from the list (e.g. the animal being edited) */
  excludeIds?: string[];
  /** Label shown in the modal header */
  label: string;
}

/**
 * Modal that displays a searchable grid of animal cards for selecting a parent.
 * Filters animals by gender and allows text search by name.
 */
export default function ParentSelectorModal({
  isOpen,
  onClose,
  onSelect,
  gender,
  selectedId,
  excludeIds = [],
  label,
}: ParentSelectorModalProps): React.ReactElement | null {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadAnimals = async (): Promise<void> => {
      setLoading(true);
      try {
        const result = await fetchAnimals(gender ? { gender } : {});
        if (Array.isArray(result)) {
          setAnimals(result);
        }
      } catch (error) {
        console.error('Error fetching animals for parent selector:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();
  }, [isOpen, gender]);

  const filteredAnimals = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    return animals
      .filter((a) => !excludeSet.has(a.id))
      .filter((a) => {
        if (!search.trim()) return true;
        return a.name.toLowerCase().includes(search.toLowerCase());
      });
  }, [animals, excludeIds, search]);

  if (!isOpen) return null;

  const handleSelect = (animalId: string): void => {
    const selected = animals.find((a) => a.id === animalId);
    onSelect(animalId, selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar modal"
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] max-w-4xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-green-dark">{label}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircleIcon size={28} color="black" title="Cerrar" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-2 bg-white outline-gray-200 rounded p-2"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Cargando animales...</p>
          ) : filteredAnimals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron animales</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {filteredAnimals.map((animal) => {
                const img = animal.images[0] ?? {
                  imgUrl: '/logo300.webp',
                  imgAlt: 'Imagen no disponible',
                };
                const isSelected = animal.id === selectedId;

                return (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => handleSelect(animal.id)}
                    className={`flex flex-col items-center rounded-xl overflow-hidden shadow cursor-pointer transition hover:scale-105 ${
                      isSelected
                        ? 'ring-4 ring-green-600 bg-green-50'
                        : 'bg-cream-light hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square w-full">
                      <Image
                        src={img.imgUrl}
                        alt={img.imgAlt}
                        className="w-full h-full object-cover"
                        width={200}
                        height={200}
                      />
                    </div>
                    <div className="p-2 w-full text-center">
                      <p className="font-bold text-sm truncate">{animal.name}</p>
                      <p className="text-xs text-gray-500">{animal.species}</p>
                    </div>
                    {isSelected && (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 mb-1 rounded">
                        Seleccionado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedId && (
          <div className="p-3 border-t flex justify-center">
            <button
              type="button"
              onClick={() => {
                onSelect('');
                onClose();
              }}
              className="text-red-600 hover:text-red-700 font-semibold text-sm"
            >
              Quitar selección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
