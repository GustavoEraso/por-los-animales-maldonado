# Role-Based Access Control (RBAC) System

This documentation describes the role-based access control system implemented in the application.

## Overview

The system provides four hierarchical roles with increasing levels of permissions:

1. **user** - Basic read-only access
2. **rescuer** - Can manage animals and adoptions
3. **admin** - Can manage rescuers and all content
4. **superadmin** - Full system access, can manage all admins and users

## Core Files

### Type Definitions

- **`src/types.tsx`** - Contains `UserRole` type and `UserType` interface

### Permission Logic

- **`src/lib/permissions.ts`** - Permission checking functions and role hierarchy

### Authentication Context

- **`src/contexts/AuthContext.tsx`** - Provides authentication state and permission helpers throughout the app

### Components

- **`src/components/ProtectedRoute.tsx`** - Route protection component (redirects unauthorized users)
- **`src/components/RoleGuard.tsx`** - UI protection component (shows/hides content)

### API

- **`src/app/api/check-user/route.ts`** - Verifies user authorization and returns role

## Usage Examples

### 1. Protecting an Entire Route

Use `ProtectedRoute` to protect an entire page:

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1>Admin Panel</h1>
        {/* Admin-only content */}
      </div>
    </ProtectedRoute>
  );
}
```

With custom loading and redirect:

```tsx
<ProtectedRoute
  requiredRole="rescuer"
  redirectPath="/login"
  loadingComponent={<Spinner />}
  unauthorizedComponent={<AccessDenied />}
>
  <AnimalManagement />
</ProtectedRoute>
```

### 2. Conditional UI Rendering

Use `RoleGuard` to show/hide UI elements:

```tsx
import RoleGuard from '@/components/RoleGuard';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show delete button only to admins */}
      <RoleGuard requiredRole="admin">
        <button onClick={handleDelete}>Delete</button>
      </RoleGuard>

      {/* Show with fallback message */}
      <RoleGuard requiredRole="rescuer" fallback={<p>Rescuer access required</p>}>
        <AnimalEditor />
      </RoleGuard>
    </div>
  );
}
```

### 3. Using Auth Context Directly

Access user state and permission helpers:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    currentUser,
    isLoadingAuth,
    checkPermission,
    checkIsAdmin,
    checkIsSuperAdmin,
    checkCanManageAnimals,
    getAvailableRoles,
  } = useAuth();

  if (isLoadingAuth) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {currentUser.name}</h1>
      <p>Your role: {currentUser.role}</p>

      {checkIsAdmin() && <button>Admin Action</button>}

      {checkCanManageAnimals() && <button>Manage Animals</button>}
    </div>
  );
}
```

### 4. Using Permission Functions Directly

Import and use permission functions anywhere:

```tsx
import { hasPermission, canManageUser, getAssignableRoles } from '@/lib/permissions';
import { UserRole } from '@/types';

function UserManagement({ userRole }: { userRole: UserRole }) {
  // Check if user can edit
  const canEdit = hasPermission(userRole, 'admin');

  // Check if user can manage another user
  const canManageRescuer = canManageUser(userRole, 'rescuer');

  // Get roles this user can assign
  const assignableRoles = getAssignableRoles(userRole);

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {assignableRoles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </div>
  );
}
```

## Permission Functions

### `hasPermission(userRole, requiredRole)`

Checks if user has at least the required permission level.

```tsx
hasPermission('admin', 'rescuer'); // true
hasPermission('rescuer', 'admin'); // false
```

### `isAdmin(userRole)`

Checks if user is admin or superadmin.

```tsx
isAdmin('admin'); // true
isAdmin('superadmin'); // true
isAdmin('rescuer'); // false
```

### `isSuperAdmin(userRole)`

Checks if user is superadmin.

```tsx
isSuperAdmin('superadmin'); // true
isSuperAdmin('admin'); // false
```

### `canManageAnimals(userRole)`

Checks if user can manage animals (rescuer or higher).

```tsx
canManageAnimals('rescuer'); // true
canManageAnimals('user'); // false
```

### `canManageUser(userRole, targetUserRole)`

Checks if user can manage another user based on their roles.

```tsx
canManageUser('admin', 'rescuer'); // true
canManageUser('admin', 'admin'); // false
canManageUser('superadmin', 'admin'); // true
```

### `getAssignableRoles(userRole)`

Gets roles that can be assigned by the user.

```tsx
getAssignableRoles('superadmin'); // ['superadmin', 'admin', 'rescuer', 'user']
getAssignableRoles('admin'); // ['rescuer', 'user']
getAssignableRoles('rescuer'); // []
```

## Admin Layout Protection

The admin dashboard layout (`src/app/plam-admin/layout.tsx`) is automatically protected and only allows access to users with admin or superadmin roles.

## Setting Up User Roles

User roles are stored in the Firestore `authorizedEmails` collection. Each user document should have:

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin"
}
```

Valid roles: `"superadmin"`, `"admin"`, `"rescuer"`, `"user"`

If no role is specified, the default is `"user"`.

## Best Practices

1. **Route Protection**: Use `ProtectedRoute` for entire pages that require authentication
2. **UI Elements**: Use `RoleGuard` for conditional rendering of buttons, sections, etc.
3. **Complex Logic**: Use `useAuth()` hook or direct permission functions for custom logic
4. **Server-Side**: Always validate permissions on the server/API as well, not just on the client
5. **Default Role**: Always handle the case where a user might not have a role assigned

## Migration Notes

If you have existing users without roles, they will default to the `"user"` role. To update existing users:

1. Update user documents in Firestore `authorizedEmails` collection
2. Add the `role` field with appropriate values
3. Users will receive their new role on next login

## Security Considerations

- Client-side permission checks are for UX only
- Always implement server-side authorization for API routes
- Never expose sensitive data based only on client-side checks
- Use Firestore security rules to enforce permissions at the database level
