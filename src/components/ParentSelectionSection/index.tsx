'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Animal } from '@/types';
import { fetchAnimals } from '@/lib/fetchAnimal';
import ParentSelectorModal from '@/components/ParentSelectorModal';

interface ParentSelectionSectionProps {
  /** Currently selected mother ID */
  motherId: string;
  /** Currently selected father ID */
  fatherId: string;
  /** Callback when mother is selected */
  onMotherSelect: (id: string) => void;
  /** Callback when father is selected */
  onFatherSelect: (id: string) => void;
  /** Animal IDs to exclude from the selector (e.g. the animal being edited/created) */
  excludeIds?: string[];
}

/**
 * Displays selected mother/father cards with buttons to open the parent selector modal.
 * Shows a mini card preview when a parent is selected, or a placeholder button otherwise.
 */
export default function ParentSelectionSection({
  motherId,
  fatherId,
  onMotherSelect,
  onFatherSelect,
  excludeIds = [],
}: ParentSelectionSectionProps): React.ReactElement {
  const [motherAnimal, setMotherAnimal] = useState<Animal | null>(null);
  const [fatherAnimal, setFatherAnimal] = useState<Animal | null>(null);
  const [modalOpen, setModalOpen] = useState<'mother' | 'father' | null>(null);

  // Fetch mother data when motherId changes
  useEffect(() => {
    if (!motherId) {
      setMotherAnimal(null);
      return;
    }
    const load = async (): Promise<void> => {
      try {
        const result = await fetchAnimals({ id: motherId });
        if (Array.isArray(result) && result.length > 0) {
          setMotherAnimal(result[0]);
        }
      } catch (error) {
        console.error('Error fetching mother animal:', error);
      }
    };
    load();
  }, [motherId]);

  // Fetch father data when fatherId changes
  useEffect(() => {
    if (!fatherId) {
      setFatherAnimal(null);
      return;
    }
    const load = async (): Promise<void> => {
      try {
        const result = await fetchAnimals({ id: fatherId });
        if (Array.isArray(result) && result.length > 0) {
          setFatherAnimal(result[0]);
        }
      } catch (error) {
        console.error('Error fetching father animal:', error);
      }
    };
    load();
  }, [fatherId]);

  return (
    <section className="bg-gray-100 p-4 rounded-lg flex flex-col gap-3">
      <h3 className="font-semibold text-center">Padres (opcional)</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Mother */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-sm">Madre</span>
          {motherAnimal ? (
            <div className="flex flex-col items-center gap-1 bg-white rounded-lg p-2 shadow w-full">
              <Image
                src={motherAnimal.images[0]?.imgUrl || '/logo300.webp'}
                alt={motherAnimal.images[0]?.imgAlt || motherAnimal.name}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <p className="font-semibold text-sm text-center truncate w-full">
                {motherAnimal.name}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setModalOpen('mother')}
                  className="text-blue-600 text-xs hover:underline"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => onMotherSelect('')}
                  className="text-red-600 text-xs hover:underline"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen('mother')}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-600 hover:text-green-600 transition text-sm"
            >
              Seleccionar madre
            </button>
          )}
        </div>

        {/* Father */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-sm">Padre</span>
          {fatherAnimal ? (
            <div className="flex flex-col items-center gap-1 bg-white rounded-lg p-2 shadow w-full">
              <Image
                src={fatherAnimal.images[0]?.imgUrl || '/logo300.webp'}
                alt={fatherAnimal.images[0]?.imgAlt || fatherAnimal.name}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <p className="font-semibold text-sm text-center truncate w-full">
                {fatherAnimal.name}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setModalOpen('father')}
                  className="text-blue-600 text-xs hover:underline"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => onFatherSelect('')}
                  className="text-red-600 text-xs hover:underline"
                >
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen('father')}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-600 hover:text-green-600 transition text-sm"
            >
              Seleccionar padre
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ParentSelectorModal
        isOpen={modalOpen === 'mother'}
        onClose={() => setModalOpen(null)}
        onSelect={onMotherSelect}
        gender="hembra"
        selectedId={motherId}
        excludeIds={excludeIds}
        label="Seleccionar madre"
      />
      <ParentSelectorModal
        isOpen={modalOpen === 'father'}
        onClose={() => setModalOpen(null)}
        onSelect={onFatherSelect}
        gender="macho"
        selectedId={fatherId}
        excludeIds={excludeIds}
        label="Seleccionar padre"
      />
    </section>
  );
}
