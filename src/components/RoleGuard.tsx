'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

/**
 * Props for the RoleGuard component.
 */
interface RoleGuardProps {
  /** Content to render when user has required permissions */
  children: ReactNode;
  /** Minimum role required to view this content */
  requiredRole: UserRole;
  /** Optional fallback content to show when user lacks permissions */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders content based on user role.
 * Unlike ProtectedRoute, this doesn't redirect - it simply shows/hides content.
 *
 * @example
 * ```tsx
 * // Show admin-only button
 * <RoleGuard requiredRole="admin">
 *   <button>Delete User</button>
 * </RoleGuard>
 * ```
 *
 * @example
 * ```tsx
 * // Show different content based on role
 * <RoleGuard
 *   requiredRole="rescuer"
 *   fallback={<p>You need rescuer access to manage animals</p>}
 * >
 *   <AnimalManagementPanel />
 * </RoleGuard>
 * ```
 */
export default function RoleGuard({ children, requiredRole, fallback = null }: RoleGuardProps) {
  const { checkPermission } = useAuth();

  if (!checkPermission(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
