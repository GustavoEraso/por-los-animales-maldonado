import type { ReactElement } from 'react';

import SponsorEditClientPage from './SponsorEditClientPage';

interface SponsorEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the sponsor edit page.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive sponsor edit form
 */
export default async function SponsorEditPage({
  params,
}: SponsorEditPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <SponsorEditClientPage sponsorId={id} />;
}
