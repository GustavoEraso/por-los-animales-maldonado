import type { ReactElement } from 'react';

import AnimalEditClientPage from './AnimalEditClientPage';

interface AnimalEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the animal edit page.
 *
 * Resolves the dynamic route parameter before passing it to the client form,
 * preventing Cache Components fallback placeholders from reaching Firestore.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive animal edit form
 */
export default async function AnimalEditPage({
  params,
}: AnimalEditPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <AnimalEditClientPage animalId={id} />;
}
