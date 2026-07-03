'use client';

import ConfirmarMatchesContent from './ConfirmarMatchesContent';

/**
 * Client component entry point for the match confirmation page.
 * Allows reviewing and associating CSV seguimiento entries
 * with existing animals in Firestore.
 */
export default function ConfirmarMatchesPage(): React.ReactElement {
  return <ConfirmarMatchesContent />;
}
