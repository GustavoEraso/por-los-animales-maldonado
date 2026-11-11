'use client';

import { useEffect } from 'react';

/**
 * Warns the user before leaving the page when there are unsaved changes.
 *
 * The browser shows its native confirmation dialog on reload, tab close or
 * navigation outside the app. Client-side route changes still need their own
 * guard, which is intentionally left out of this hook.
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
