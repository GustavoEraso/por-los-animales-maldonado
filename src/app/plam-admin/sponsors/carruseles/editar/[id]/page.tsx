import type { ReactElement } from 'react';

import CarouselEditClientPage from './CarouselEditClientPage';

interface CarouselEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the sponsor carousel edit page.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive carousel edit form
 */
export default async function CarouselEditPage({
  params,
}: CarouselEditPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <CarouselEditClientPage carouselId={id} />;
}
