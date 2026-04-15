'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Animal, AnimalTransactionType } from '@/types';
import { fetchAnimals } from '@/lib/fetchAnimal';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { revalidateCache } from '@/lib/revalidateCache';
import { auth } from '@/firebase';
import Card from '@/components/Card';
import ParentSelectorModal from '@/components/ParentSelectorModal';
import generateId from '@/lib/generateId';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';

interface AnimalFamilySectionProps {
  animal: Animal;
  setAnimal: React.Dispatch<React.SetStateAction<Animal | null>>;
  setAllAnimalTransactions: React.Dispatch<React.SetStateAction<AnimalTransactionType[]>>;
}

/**
 * Displays and manages the family relationships of an animal:
 * parents (with inline editing), litter siblings, and offspring.
 */
export default function AnimalFamilySection({
  animal,
  setAnimal,
  setAllAnimalTransactions,
}: AnimalFamilySectionProps): React.ReactElement {
  const [siblings, setSiblings] = useState<Animal[]>([]);
  const [offspring, setOffspring] = useState<Animal[]>([]);
  const [motherModalOpen, setMotherModalOpen] = useState(false);
  const [fatherModalOpen, setFatherModalOpen] = useState(false);
  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [siblingMenuOpen, setSiblingMenuOpen] = useState(false);
  const [mother, setMother] = useState<Animal | null>(null);
  const [father, setFather] = useState<Animal | null>(null);

  // Fetch parents
  useEffect(() => {
    const loadParents = async (): Promise<void> => {
      if (animal.motherId) {
        try {
          const result = await fetchAnimals({ id: animal.motherId });
          if (Array.isArray(result) && result.length > 0) setMother(result[0]);
        } catch (err) {
          console.error('Error fetching mother:', err);
        }
      } else {
        setMother(null);
      }
      if (animal.fatherId) {
        try {
          const result = await fetchAnimals({ id: animal.fatherId });
          if (Array.isArray(result) && result.length > 0) setFather(result[0]);
        } catch (err) {
          console.error('Error fetching father:', err);
        }
      } else {
        setFather(null);
      }
    };
    loadParents();
  }, [animal.motherId, animal.fatherId]);

  // Fetch siblings
  useEffect(() => {
    const loadSiblings = async (): Promise<void> => {
      if (!animal.litterId) {
        setSiblings([]);
        return;
      }
      try {
        const result = await fetchAnimals({ litterId: animal.litterId });
        if (Array.isArray(result)) {
          setSiblings(result.filter((s) => s.id !== animal.id));
        }
      } catch (err) {
        console.error('Error fetching siblings:', err);
      }
    };
    loadSiblings();
  }, [animal.litterId, animal.id]);

  // Fetch offspring
  useEffect(() => {
    const loadOffspring = async (): Promise<void> => {
      try {
        const [byMother, byFather] = await Promise.all([
          fetchAnimals({ id: animal.id }).then(() =>
            getFirestoreData({
              currentCollection: 'animals',
              filter: [['motherId', '==', animal.id]],
            })
          ),
          getFirestoreData({
            currentCollection: 'animals',
            filter: [['fatherId', '==', animal.id]],
          }),
        ]);
        const map = new Map<string, Animal>();
        for (const child of [...(byMother as Animal[]), ...(byFather as Animal[])]) {
          if (!child.isDeleted) map.set(child.id, child);
        }
        setOffspring(Array.from(map.values()));
      } catch (err) {
        console.error('Error fetching offspring:', err);
      }
    };
    loadOffspring();
  }, [animal.id]);

  const handleParentChange = async (
    role: 'mother' | 'father',
    newParentId: string,
    parentAnimal?: Animal
  ): Promise<void> => {
    const field = role === 'mother' ? 'motherId' : 'fatherId';
    const oldValue = animal[field] || '';

    if (newParentId === oldValue) return;

    // Optimistic update
    const previousAnimal = { ...animal };
    const previousMother = mother;
    const previousFather = father;
    const updatedAnimal = { ...animal, [field]: newParentId };
    setAnimal(updatedAnimal);
    if (role === 'mother') setMother(newParentId ? (parentAnimal ?? null) : null);
    if (role === 'father') setFather(newParentId ? (parentAnimal ?? null) : null);

    // Build transaction
    const now = Date.now();
    const newTransaction: AnimalTransactionType = {
      transactionType: 'update',
      transactionId: generateId(),
      id: animal.id,
      name: animal.name,
      img: animal.images[0] || undefined,
      date: now,
      since: now,
      modifiedBy: auth.currentUser?.email || '',
      changes: {
        before: { [field]: oldValue },
        after: { [field]: newParentId },
      },
    };

    setAllAnimalTransactions((prev) => [newTransaction, ...prev]);

    try {
      // Save animal + transaction
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Animal>({
            data: updatedAnimal,
            currentCollection: 'animals',
            id: animal.id,
          }),
          postTransactionData({
            data: newTransaction,
            id: newTransaction.transactionId!,
          }),
        ]),
        {
          messages: {
            pending: {
              title: 'Actualizando...',
              text: `Asociando ${role === 'mother' ? 'madre' : 'padre'}...`,
            },
            success: {
              title: 'Actualizado',
              text: `${role === 'mother' ? 'Madre' : 'Padre'} ${newParentId ? 'asociado/a' : 'removido/a'} correctamente`,
            },
            error: {
              title: 'Error',
              text: `No se pudo actualizar el ${role === 'mother' ? 'madre' : 'padre'}`,
            },
          },
        }
      );

      // Propagate to litter siblings
      if (animal.litterId) {
        try {
          const litterSiblings = await getFirestoreData({
            currentCollection: 'animals',
            filter: [['litterId', '==', animal.litterId]],
          });

          const siblingUpdates = (litterSiblings as Animal[])
            .filter((s) => s.id !== animal.id)
            .map((sibling) =>
              postFirestoreData<Partial<Animal> & { id: string }>({
                data: { id: sibling.id, [field]: newParentId },
                currentCollection: 'animals',
                id: sibling.id,
              })
            );

          if (siblingUpdates.length > 0) {
            await Promise.all(siblingUpdates);
            handleToast({
              type: 'info',
              title: 'Hermanos actualizados',
              text: `Se actualizó ${role === 'mother' ? 'la madre' : 'el padre'} en ${siblingUpdates.length} hermano(s) de camada`,
            });
          }
        } catch (err) {
          console.error('Error propagating parent to siblings:', err);
        }
      }

      await revalidateCache('animals');
    } catch {
      // Revert optimistic update
      setAnimal(previousAnimal);
      if (role === 'mother') setMother(previousMother);
      if (role === 'father') setFather(previousFather);
      setAllAnimalTransactions((prev) =>
        prev.filter((t) => t.transactionId !== newTransaction.transactionId)
      );
    }
  };

  const handleAssociateSibling = async (
    siblingId: string,
    siblingAnimal?: Animal
  ): Promise<void> => {
    if (!siblingId || !animal.litterId) return;

    // Optimistic update — add to siblings grid immediately
    const previousSiblings = [...siblings];
    if (siblingAnimal) {
      setSiblings((prev) => [...prev, siblingAnimal]);
    }

    const now = Date.now();
    const siblingData: Partial<Animal> & { id: string } = {
      id: siblingId,
      litterId: animal.litterId,
      litterName: animal.litterName || '',
      ...(animal.motherId ? { motherId: animal.motherId } : {}),
      ...(animal.fatherId ? { fatherId: animal.fatherId } : {}),
    };

    const newTransaction: AnimalTransactionType = {
      transactionType: 'update',
      transactionId: generateId(),
      id: siblingId,
      name: siblingAnimal?.name || siblingId,
      date: now,
      since: now,
      modifiedBy: auth.currentUser?.email || '',
      changes: {
        before: { litterId: '' },
        after: { litterId: animal.litterId, litterName: animal.litterName || '' },
      },
    };

    try {
      await handlePromiseToast(
        Promise.all([
          postFirestoreData<Partial<Animal> & { id: string }>({
            data: siblingData,
            currentCollection: 'animals',
            id: siblingId,
          }),
          postTransactionData({
            data: newTransaction,
            id: newTransaction.transactionId!,
          }),
        ]),
        {
          messages: {
            pending: { title: 'Asociando...', text: 'Agregando hermano a la camada...' },
            success: {
              title: 'Hermano agregado',
              text: 'El animal fue asociado a la camada correctamente',
            },
            error: { title: 'Error', text: 'No se pudo asociar el animal a la camada' },
          },
        }
      );

      await revalidateCache('animals');
    } catch {
      // Revert optimistic update
      setSiblings(previousSiblings);
    }
  };

  const hasFamily =
    animal.motherId || animal.fatherId || siblings.length > 0 || offspring.length > 0;

  const allRelatedIds = [
    animal.id,
    ...(animal.motherId ? [animal.motherId] : []),
    ...(animal.fatherId ? [animal.fatherId] : []),
    ...siblings.map((s) => s.id),
    ...offspring.map((o) => o.id),
  ];

  return (
    <section className="flex flex-col items-center gap-6 px-9 py-4 w-full max-w-7xl">
      <h2 className="text-2xl font-bold text-green-dark">Familia</h2>

      {/* Parents */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-green-dark">Padres</h3>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Mother slot */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Madre</span>
            {mother ? (
              <div className="w-48">
                <Card animal={mother} href={`/plam-admin/animales/${mother.id}`} adminView />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm text-center p-2">
                Sin madre asociada
              </div>
            )}
            <button
              type="button"
              onClick={() => setMotherModalOpen(true)}
              className="text-sm bg-green-forest text-white px-3 py-1.5 rounded-lg hover:bg-green-dark transition cursor-pointer"
            >
              {animal.motherId ? 'Cambiar madre' : 'Asociar madre'}
            </button>
            {animal.motherId && (
              <button
                type="button"
                onClick={() => handleParentChange('mother', '')}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                Quitar madre
              </button>
            )}
          </div>

          {/* Father slot */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Padre</span>
            {father ? (
              <div className="w-48">
                <Card animal={father} href={`/plam-admin/animales/${father.id}`} adminView />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm text-center p-2">
                Sin padre asociado
              </div>
            )}
            <button
              type="button"
              onClick={() => setFatherModalOpen(true)}
              className="text-sm bg-green-forest text-white px-3 py-1.5 rounded-lg hover:bg-green-dark transition cursor-pointer"
            >
              {animal.fatherId ? 'Cambiar padre' : 'Asociar padre'}
            </button>
            {animal.fatherId && (
              <button
                type="button"
                onClick={() => handleParentChange('father', '')}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                Quitar padre
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Litter siblings */}
      {animal.litterId && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-green-dark">
              🐾 Hermanos de camada ({animal.litterName || 'Camada'})
            </h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSiblingMenuOpen((prev) => !prev)}
                className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition flex items-center gap-1 cursor-pointer"
              >
                + Agregar hermano
              </button>
              {siblingMenuOpen && (
                <>
                  <button
                    className="fixed inset-0 z-40"
                    onClick={() => setSiblingMenuOpen(false)}
                    aria-label="Cerrar menú"
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[180px] overflow-hidden">
                    <Link
                      href={`/plam-admin/animales/crear?litterId=${encodeURIComponent(animal.litterId)}&litterName=${encodeURIComponent(animal.litterName || '')}&motherId=${encodeURIComponent(animal.motherId || '')}&fatherId=${encodeURIComponent(animal.fatherId || '')}`}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-cream-light transition"
                      onClick={() => setSiblingMenuOpen(false)}
                    >
                      🆕 Crear nuevo
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSiblingMenuOpen(false);
                        setSiblingModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-cream-light transition cursor-pointer"
                    >
                      🔗 Asociar existente
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {siblings.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 w-full">
              {siblings.map((sibling) => (
                <Card
                  key={sibling.id}
                  animal={sibling}
                  href={`/plam-admin/animales/${sibling.id}`}
                  adminView
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay otros hermanos en esta camada</p>
          )}
        </div>
      )}

      {/* Offspring */}
      {offspring.length > 0 && (
        <div className="w-full">
          <h3 className="text-xl font-semibold text-green-dark mb-3">Hijos ({offspring.length})</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 w-full">
            {offspring.map((child) => (
              <Card
                key={child.id}
                animal={child}
                href={`/plam-admin/animales/${child.id}`}
                adminView
              />
            ))}
          </div>
        </div>
      )}

      {!hasFamily && !animal.litterId && (
        <p className="text-gray-400 text-center py-2">
          Este animal no tiene relaciones familiares registradas
        </p>
      )}

      {/* Parent selector modals */}
      <ParentSelectorModal
        isOpen={motherModalOpen}
        onClose={() => setMotherModalOpen(false)}
        onSelect={(id, selectedAnimal) => handleParentChange('mother', id, selectedAnimal)}
        gender="hembra"
        selectedId={animal.motherId}
        excludeIds={allRelatedIds}
        label="Seleccionar madre"
      />
      <ParentSelectorModal
        isOpen={fatherModalOpen}
        onClose={() => setFatherModalOpen(false)}
        onSelect={(id, selectedAnimal) => handleParentChange('father', id, selectedAnimal)}
        gender="macho"
        selectedId={animal.fatherId}
        excludeIds={allRelatedIds}
        label="Seleccionar padre"
      />
      {animal.litterId && (
        <ParentSelectorModal
          isOpen={siblingModalOpen}
          onClose={() => setSiblingModalOpen(false)}
          onSelect={(id, selectedAnimal) => handleAssociateSibling(id, selectedAnimal)}
          excludeIds={allRelatedIds}
          label="Asociar hermano existente a la camada"
        />
      )}
    </section>
  );
}
