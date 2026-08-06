import type { ReactElement } from 'react';

import UserEditClientPage from './UserEditClientPage';

interface UserEditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the authorized user edit page.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive user edit form
 */
export default async function UserEditPage({ params }: UserEditPageProps): Promise<ReactElement> {
  const { id } = await params;

  return <UserEditClientPage userId={id} />;
}
