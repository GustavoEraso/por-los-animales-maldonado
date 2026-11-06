import { Suspense } from 'react';
import type { ReactElement } from 'react';
import Loader from '@/components/Loader';
import PostulanteDetailContent from './PostulanteDetailContent';

interface PostulanteDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server wrapper for the applicant (ficha de postulante) detail page.
 *
 * @param props - Dynamic route parameters containing the applicant id
 * @returns The interactive applicant detail page
 */
export default async function PostulanteDetailPage({
  params,
}: PostulanteDetailPageProps): Promise<ReactElement> {
  const { id } = await params;
  return (
    <Suspense fallback={<Loader />}>
      <PostulanteDetailContent applicantId={id} />
    </Suspense>
  );
}
