import { UserRole } from '@/types';

/**
 * Role hierarchy definition.
 * Higher index = higher privileges.
 */
const ROLE_HIERARCHY: UserRole[] = ['user', 'rescuer', 'admin', 'superadmin'];

/**
 * Checks if a user role has at least the required permission level.
 *
 * @param userRole - The role of the current user
 * @param requiredRole - The minimum role required for the action
 * @returns true if the user has sufficient permissions
 *
 * @example
 * hasPermission('admin', 'rescuer') // returns true
 * hasPermission('rescuer', 'admin') // returns false
 */
export function hasPermission(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;

  const userRoleLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleLevel = ROLE_HIERARCHY.indexOf(requiredRole);

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Checks if a user has admin privileges (admin or superadmin).
 *
 * @param userRole - The role of the current user
 * @returns true if the user is an admin or superadmin
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'admin');
}

/**
 * Checks if a user is a superadmin.
 *
 * @param userRole - The role of the current user
 * @returns true if the user is a superadmin
 */
export function isSuperAdmin(userRole: UserRole | undefined): boolean {
  return userRole === 'superadmin';
}

/**
 * Checks if a user can manage animals (rescuer or higher).
 *
 * @param userRole - The role of the current user
 * @returns true if the user can manage animals
 */
export function canManageAnimals(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'rescuer');
}

/**
 * Checks if a user can manage other users.
 * Only superadmins can manage admins.
 * Admins can manage rescuers and users.
 *
 * @param userRole - The role of the current user
 * @param targetUserRole - The role of the user being managed
 * @returns true if the user can manage the target user
 */
export function canManageUser(userRole: UserRole | undefined, targetUserRole: UserRole): boolean {
  if (!userRole) return false;

  // Superadmins can manage everyone
  if (isSuperAdmin(userRole)) return true;

  // Admins can manage rescuers and users, but not other admins
  if (userRole === 'admin') {
    return targetUserRole === 'rescuer' || targetUserRole === 'user';
  }

  return false;
}

/**
 * Gets the available roles that a user can assign to others.
 *
 * @param userRole - The role of the current user
 * @returns Array of roles that can be assigned
 */
export function getAssignableRoles(userRole: UserRole | undefined): UserRole[] {
  if (!userRole) return [];

  if (isSuperAdmin(userRole)) {
    return ['superadmin', 'admin', 'rescuer', 'user'];
  }

  if (userRole === 'admin') {
    return ['rescuer', 'user'];
  }

  return [];
}
