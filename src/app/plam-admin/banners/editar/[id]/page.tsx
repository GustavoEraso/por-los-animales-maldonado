import type { ReactElement } from 'react';

import BannerEditClientPage from './BannerEditClientPage';

interface BannerEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the banner edit page.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive banner edit form
 */
export default async function BannerEditPage({
  params,
}: BannerEditPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <BannerEditClientPage bannerId={id} />;
}
