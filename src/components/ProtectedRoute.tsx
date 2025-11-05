'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  /** Content to render when user has proper permissions */
  children: ReactNode;
  /** Minimum role required to access this route */
  requiredRole: UserRole;
  /** Optional path to redirect to if unauthorized (defaults to '/') */
  redirectPath?: string;
  /** Optional loading component to show while checking auth */
  loadingComponent?: ReactNode;
  /** Optional component to show when user lacks permissions */
  unauthorizedComponent?: ReactNode;
}

/**
 * Component that protects routes based on user role.
 * Redirects or shows an error message if the user doesn't have the required permissions.
 *
 * @example
 * ```tsx
 * // Protect a route that requires admin access
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 *
 * @example
 * ```tsx
 * // With custom redirect and loading
 * <ProtectedRoute
 *   requiredRole="rescatista"
 *   redirectPath="/login"
 *   loadingComponent={<Spinner />}
 * >
 *   <AnimalManagement />
 * </ProtectedRoute>
 * ```
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  redirectPath = '/',
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { firebaseUser, isLoadingAuth, checkPermission } = useAuth();

  useEffect(() => {
    // Wait for auth to load before checking permissions
    if (isLoadingAuth) return;

    // Redirect if not authenticated
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    // Redirect if user doesn't have required permission
    if (!checkPermission(requiredRole)) {
      router.replace(redirectPath);
      return;
    }
  }, [firebaseUser, isLoadingAuth, checkPermission, requiredRole, redirectPath, router]);

  // Show loading state while checking authentication
  if (isLoadingAuth) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render protected content if not authorized
  if (!firebaseUser || !checkPermission(requiredRole)) {
    return unauthorizedComponent ? <>{unauthorizedComponent}</> : null;
  }

  return <>{children}</>;
}
