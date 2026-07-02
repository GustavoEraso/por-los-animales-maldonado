'use client';

import SeguimientosPageContent from './SeguimientosPageContent';

/**
 * Client component entry point for the adoption follow-up page.
 * Data fetching happens inside SeguimientosPageContent (client-side)
 * because Firestore requires authentication.
 */
export default function SeguimientosPage(): React.ReactElement {
  return <SeguimientosPageContent />;
}
