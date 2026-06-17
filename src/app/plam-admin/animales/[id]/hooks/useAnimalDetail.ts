'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { handleToast } from '@/lib/handleToast';
import { logger } from '@/lib/logger';

interface UseAnimalDetailReturn {
  animal: Animal | null;
  setAnimal: React.Dispatch<React.SetStateAction<Animal | null>>;
  privateInfo: PrivateInfoType | null;
  setPrivateInfo: React.Dispatch<React.SetStateAction<PrivateInfoType | null>>;
  allAnimalTransactions: AnimalTransactionType[];
  setAllAnimalTransactions: React.Dispatch<React.SetStateAction<AnimalTransactionType[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Custom hook that fetches and manages the state for an animal detail page.
 * Loads animal data, private info, and transactions from Firestore.
 *
 * @returns Object with animal data, private info, transactions, and loading state
 */
export function useAnimalDetail(): UseAnimalDetailReturn {
  const params = useParams();
  const currentId = params.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoType | null>(null);
  const [allAnimalTransactions, setAllAnimalTransactions] = useState<AnimalTransactionType[]>([]);

  useEffect(() => {
    const fetchAnimalData = async (): Promise<void> => {
      try {
        if (!currentId) return;

        const animalData = await getFirestoreDocById<Animal>({
          currentCollection: 'animals',
          id: currentId,
        });
        if (!animalData) {
          logger({ level: 'error', code: 'FETCH_ANIMAL', message: 'Animal not found' });
          throw new Error('Animal not found');
        }

        const currentPrivateInfo = await getFirestoreDocById<PrivateInfoType>({
          currentCollection: 'animalPrivateInfo',
          id: currentId,
        });
        if (!currentPrivateInfo) {
          logger({ level: 'error', code: 'FETCH_PRIVATE_INFO', message: 'Private info not found' });
          throw new Error('Private info not found');
        }

        const currentTransactions = await getFirestoreData({
          currentCollection: 'animalTransactions',
          filter: [['id', '==', currentId]],
        });
        if (!currentTransactions) {
          logger({ level: 'error', code: 'FETCH_TRANSACTIONS', message: 'Transaction info not found for this animal' });
          throw new Error('Transaction info not found for this animal');
        }

        const sortedTransactions = currentTransactions.sort(
          (a: AnimalTransactionType, b: AnimalTransactionType) => b.date - a.date
        );

        setAllAnimalTransactions(sortedTransactions);
        setAnimal(animalData);
        setPrivateInfo(currentPrivateInfo);
      } catch (error) {
        logger({ level: 'error', code: 'FETCH_ANIMAL', message: 'Error fetching animal data:', data: error });
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'Error al obtener los datos del animal.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimalData();
  }, [currentId]);

  return {
    animal,
    setAnimal,
    privateInfo,
    setPrivateInfo,
    allAnimalTransactions,
    setAllAnimalTransactions,
    isLoading,
    setIsLoading,
  };
}
