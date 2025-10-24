'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

/**
 * Component that shows a toast notification when a user is not authorized.
 * Should be placed in the root layout to monitor authentication state.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <UnauthorizedAlert />
 *   <App />
 * </AuthProvider>
 * ```
 */
export default function UnauthorizedAlert() {
  const { authError, firebaseUser } = useAuth();

  useEffect(() => {
    // Only show toast if there's an auth error and user tried to log in
    if (authError === 'User not authorized' && firebaseUser === null) {
      toast.error(
        'No estás autorizado para acceder a esta aplicación. Contacta al administrador.',
        {
          autoClose: 5000,
          position: 'top-center',
        }
      );
    }
  }, [authError, firebaseUser]);

  return null;
}
