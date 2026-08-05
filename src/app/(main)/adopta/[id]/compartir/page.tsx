import { Suspense, type ReactElement } from 'react';

import Loader from '@/components/Loader';
import { getAnimalsData } from '@/lib/data/animals';
import { getContactsData } from '@/lib/data/contacts';
import { logger } from '@/lib/logger';

import CompartirClient from './CompartirClient';

interface CompartirPageProps {
  params: Promise<{ id: string }>;
}

async function CompartirData({ params }: CompartirPageProps): Promise<ReactElement> {
  const { id } = await params;
  const [animalsResult, contactsResult] = await Promise.allSettled([
    getAnimalsData(),
    getContactsData(),
  ]);

  const animals = animalsResult.status === 'fulfilled' ? animalsResult.value : [];
  const contacts = contactsResult.status === 'fulfilled' ? contactsResult.value : [];

  if (animalsResult.status === 'rejected') {
    logger({
      level: 'error',
      code: 'FETCH_SHARE_ANIMALS',
      message: 'Error fetching animals for share page:',
      data: animalsResult.reason,
    });
  }

  if (contactsResult.status === 'rejected') {
    logger({
      level: 'error',
      code: 'FETCH_SHARE_CONTACTS',
      message: 'Error fetching contacts for share page:',
      data: contactsResult.reason,
    });
  }

  const animal = animals.find((animalItem) => animalItem.id === id) ?? null;
  const litterAnimals = animal?.litterId
    ? animals
        .filter((animalItem) => animalItem.litterId === animal.litterId)
        .sort((first, second) => first.name.localeCompare(second.name))
    : [];

  return (
    <CompartirClient
      key={id}
      initialAnimal={animal}
      initialContacts={animal ? contacts : []}
      initialLitterAnimals={litterAnimals}
    />
  );
}

/**
 * Server wrapper for the share-image editor.
 *
 * Loads shared data through cached server functions before rendering the client editor.
 *
 * @param props - Dynamic route parameters
 * @returns The share-image editor with its initial data
 */
export default function CompartirPage({ params }: CompartirPageProps): ReactElement {
  return (
    <Suspense fallback={<Loader />}>
      <CompartirData params={params} />
    </Suspense>
  );
}
