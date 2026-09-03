import { Suspense } from 'react';
import Loader from '@/components/Loader';
import PostulantesPageContent from './PostulantesPageContent';

/**
 * Admin page that lists applicant profiles (fichas de postulantes).
 *
 * @example
 * // Accessed via /plam-admin/postulantes
 */
export default function PostulantesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PostulantesPageContent />
    </Suspense>
  );
}
