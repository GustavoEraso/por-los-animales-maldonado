import type { ReactElement } from 'react';

import AnimalClientPage from './AnimalClientPage';

interface AnimalPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the administrative animal detail page.
 *
 * Resolves the dynamic route parameter before passing it to the client page,
 * avoiding fallback route placeholders from Cache Components.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive animal detail page
 */
export default async function AnimalPage({ params }: AnimalPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <AnimalClientPage animalId={id} />;
}
