'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Animal } from '@/types';
import { fetchAnimals } from '@/lib/fetchAnimal';

interface AnimalParentsSectionProps {
  /** The current animal (to read motherId/fatherId) */
  animal: Animal;
}

/**
 * Displays parent cards (mother/father) in the admin animal detail page.
 * Only renders when the animal has at least one parent ID set.
 */
export default function AnimalParentsSection({
  animal,
}: AnimalParentsSectionProps): React.ReactElement | null {
  const [mother, setMother] = useState<Animal | null>(null);
  const [father, setFather] = useState<Animal | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (animal.motherId) {
        try {
          const result = await fetchAnimals({ id: animal.motherId });
          if (Array.isArray(result) && result.length > 0) setMother(result[0]);
        } catch (err) {
          console.error('Error fetching mother:', err);
        }
      }
      if (animal.fatherId) {
        try {
          const result = await fetchAnimals({ id: animal.fatherId });
          if (Array.isArray(result) && result.length > 0) setFather(result[0]);
        } catch (err) {
          console.error('Error fetching father:', err);
        }
      }
    };
    load();
  }, [animal.motherId, animal.fatherId]);

  if (!animal.motherId && !animal.fatherId) return null;

  return (
    <section className="flex flex-col items-center gap-4 px-9 py-4 w-full max-w-7xl">
      <h3 className="text-xl font-bold text-green-dark">Padres</h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {animal.motherId && <ParentCard parent={mother} role="Madre" parentId={animal.motherId} />}
        {animal.fatherId && <ParentCard parent={father} role="Padre" parentId={animal.fatherId} />}
      </div>
    </section>
  );
}

function ParentCard({
  parent,
  role,
  parentId,
}: {
  parent: Animal | null;
  role: string;
  parentId: string;
}): React.ReactElement {
  if (!parent) {
    return (
      <div className="flex flex-col items-center gap-1 bg-gray-100 rounded-lg p-3 w-36">
        <span className="text-xs font-semibold text-gray-500">{role}</span>
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    );
  }

  const img = parent.images[0] ?? { imgUrl: '/logo300.webp', imgAlt: parent.name };

  return (
    <Link
      href={`/plam-admin/animales/${parentId}`}
      className="flex flex-col items-center gap-1 bg-cream-light rounded-lg p-3 shadow hover:shadow-md transition w-36"
    >
      <span className="text-xs font-semibold text-gray-600">{role}</span>
      <Image
        src={img.imgUrl}
        alt={img.imgAlt}
        width={80}
        height={80}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <p className="font-bold text-sm text-center truncate w-full">{parent.name}</p>
    </Link>
  );
}
