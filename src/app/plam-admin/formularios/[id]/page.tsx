import { Suspense } from 'react';
import type { ReactElement } from 'react';
import Loader from '@/components/Loader';
import { getActiveAnimalsData } from '@/lib/data/animals';
import { getUsersData } from '@/lib/data/users';
import FormularioDetailContent from './FormularioDetailContent';

interface FormularioDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the adoption form detail page.
 *
 * @param props - Dynamic route parameters
 * @returns The interactive form detail page
 */
export default async function FormularioDetailPage({
  params,
}: FormularioDetailPageProps): Promise<ReactElement> {
  const { id } = await params;
  const animals = await getActiveAnimalsData();
  const users = await getUsersData();

  return (
    <Suspense fallback={<Loader />}>
      <FormularioDetailContent formId={id} initialAnimals={animals} initialUsers={users} />
    </Suspense>
  );
}
