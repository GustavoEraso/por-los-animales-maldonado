'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase';
import { UserType, UserRole } from '@/types';
import {
  hasPermission,
  isAdmin,
  isSuperAdmin,
  canManageAnimals,
  canManageUser,
  getAssignableRoles,
} from '@/lib/permissions';

/**
 * Authentication context value containing user state and permission helpers.
 */
interface AuthContextValue {
  /** Current Firebase user object */
  firebaseUser: FirebaseUser | null;
  /** Current user data including role information */
  currentUser: UserType | null;
  /** Loading state during authentication check */
  isLoadingAuth: boolean;
  /** Error message if authentication fails */
  authError: string | null;
  /** Whether the current user is authorized (exists in authorizedEmails) */
  isAuthorized: boolean;

  // Permission helpers
  /** Checks if user has at least the required role level */
  checkPermission: (requiredRole: UserRole) => boolean;
  /** Checks if user is admin or superadmin */
  checkIsAdmin: () => boolean;
  /** Checks if user is superadmin */
  checkIsSuperAdmin: () => boolean;
  /** Checks if user can manage animals */
  checkCanManageAnimals: () => boolean;
  /** Checks if user can manage another user based on their role */
  checkCanManageUser: (targetUserRole: UserRole) => boolean;
  /** Gets list of roles the current user can assign to others */
  getAvailableRoles: () => UserRole[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component.
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider that manages user state and permissions.
 * Wraps the application to provide authentication context to all components.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthError(null);

      if (user) {
        try {
          // Fetch user role from API
          const response = await fetch('/api/check-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
            }),
          });

          if (!response.ok) {
            setAuthError('Failed to fetch user data');
            setCurrentUser(null);
            setIsLoadingAuth(false);
            return;
          }

          const result = await response.json();

          // Check if user is authorized
          if (!result.authorized) {
            setAuthError('User not authorized');
            setCurrentUser(null);
            setIsAuthorized(false);
            setIsLoadingAuth(false);
            // Sign out unauthorized user
            await auth.signOut();
            return;
          }

          const userData: UserType = {
            id: user.uid,
            name: result.name,
            role: result.role,
          };

          setCurrentUser(userData);
          setIsAuthorized(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthError('Failed to load user permissions');
          setCurrentUser(null);
          setIsAuthorized(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
      }

      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Permission helper functions
  const checkPermission = (requiredRole: UserRole): boolean => {
    return hasPermission(currentUser?.role, requiredRole);
  };

  const checkIsAdmin = (): boolean => {
    return isAdmin(currentUser?.role);
  };

  const checkIsSuperAdmin = (): boolean => {
    return isSuperAdmin(currentUser?.role);
  };

  const checkCanManageAnimals = (): boolean => {
    return canManageAnimals(currentUser?.role);
  };

  const checkCanManageUser = (targetUserRole: UserRole): boolean => {
    return canManageUser(currentUser?.role, targetUserRole);
  };

  const getAvailableRoles = (): UserRole[] => {
    return getAssignableRoles(currentUser?.role);
  };

  const contextValue: AuthContextValue = {
    firebaseUser,
    currentUser,
    isLoadingAuth,
    authError,
    isAuthorized,
    checkPermission,
    checkIsAdmin,
    checkIsSuperAdmin,
    checkCanManageAnimals,
    checkCanManageUser,
    getAvailableRoles,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 *
 * @throws Error if used outside of AuthProvider
 * @returns Authentication context value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentUser, checkIsAdmin } = useAuth();
 *
 *   if (checkIsAdmin()) {
 *     return <AdminPanel />;
 *   }
 *   return <UserPanel />;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
