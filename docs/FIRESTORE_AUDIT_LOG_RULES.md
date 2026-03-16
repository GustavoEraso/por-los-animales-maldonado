# Firestore Security Rules

## Overview

This document contains the complete Firestore security rules for the application. These rules enforce role-based access control (RBAC) across all collections, ensure audit logs are immutable, and protect sensitive data.

## Complete Rules

Add the following rules in the Firebase Console (Firestore Database → Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    /* ───── Helpers ───── */

    // Helper function to get role hierarchy level
    function getRoleLevel(role) {
      return role == 'superadmin' ? 4 :
             role == 'admin' ? 3 :
             role == 'rescatista' ? 2 :
             role == 'user' ? 1 : 0;
    }

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to get user role safely
    function getUserRole() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/authorizedEmails/$(request.auth.token.email))
        ? get(/databases/$(database)/documents/authorizedEmails/$(request.auth.token.email)).data.role
        : null;
    }

    function isSuperadmin() {
      return isAuthenticated() && getRoleLevel(getUserRole()) >= 4;
    }

    function isAdmin() {
      return isAuthenticated() && getRoleLevel(getUserRole()) >= 3;
    }

    function isRescuer() {
      return isAuthenticated() && getRoleLevel(getUserRole()) >= 2;
    }

    /* ───── 1) animals ───── */
    match /animals/{id} {
      allow read: if true;
      allow write: if isRescuer();
    }

    /* ───── 2) contacts ───── */
    match /contacts/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    /* ───── 3) animalPrivateInfo ───── */
    match /animalPrivateInfo/{id} {
      allow read, write: if isRescuer();
    }

    /* ───── 4) animalTransactions ───── */
    match /animalTransactions/{id} {
      allow read, write: if isRescuer();
    }

    /* ───── 5) systemAuditLog ───── */
    match /systemAuditLog/{logId} {

      allow read: if isAdmin();

      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['type', 'action', 'entityId', 'modifiedBy', 'date'])
        && request.resource.data.type in ['user', 'banner', 'contact', 'animal', 'config']
        && request.resource.data.action in ['create', 'update', 'delete']
        && request.resource.data.entityId is string
        && request.resource.data.modifiedBy is string
        && request.resource.data.date is number
        && request.resource.data.date > 0;

      allow update, delete: if false;
    }

    /* ───── 6) authorizedEmails ───── */
    match /authorizedEmails/{emailId} {

      allow read: if true;

      function isPrivilegedRole(role) {
        return role in ['admin', 'superadmin'];
      }

      allow create: if isAuthenticated() && (
        isSuperadmin() ||
        (isAdmin() && !isPrivilegedRole(request.resource.data.role))
      )
      && request.resource.data.keys().hasAll(['email', 'name', 'role'])
      && request.resource.data.email == emailId;

      allow update: if isAuthenticated()
        && request.resource.data.email == resource.data.email
        && request.resource.data.email == emailId
        && (
          isSuperadmin() ||
          (
            isAdmin() &&
            !isPrivilegedRole(resource.data.role) &&
            !isPrivilegedRole(request.resource.data.role)
          )
        );

      allow delete: if isSuperadmin();
    }

    /* ───── 7) banners ───── */
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    /* ───── 8) dashboardAnalytics ───── */
    match /dashboardAnalytics/{docId} {
      allow read: if true;
      allow write: if isRescuer();
    }

  }
}
```

## Helper Functions

### `getRoleLevel(role)`

Maps role strings to numeric levels for hierarchical comparison:

| Role         | Level |
| ------------ | ----- |
| `superadmin` | 4     |
| `admin`      | 3     |
| `rescatista` | 2     |
| `user`       | 1     |
| unknown      | 0     |

### `getUserRole()`

Safely retrieves the user's role from the `authorizedEmails` collection. Uses `exists()` to check if the document exists before reading, returning `null` if the user is not found. This prevents errors when unauthenticated or unregistered users access the system.

### `isSuperadmin()`, `isAdmin()`, `isRescuer()`

Shorthand functions that combine `isAuthenticated()` and `getRoleLevel()` to check minimum permission levels.

## Collection Rules Explained

### 1. `animals` — Public animal data

- **Read**: Public (anyone can read)
- **Write**: Rescuer or higher (rescatista, admin, superadmin)

### 2. `contacts` — WhatsApp contacts

- **Read**: Public (displayed on the site)
- **Write**: Admin or higher

### 3. `animalPrivateInfo` — Sensitive animal data

- **Read/Write**: Rescuer or higher
- Contains medical history, case manager, contacts, notes

### 4. `animalTransactions` — Event history

- **Read/Write**: Rescuer or higher
- Stores timeline events: medical, adoption, transit changes, etc.

### 5. `systemAuditLog` — Immutable audit trail

- **Read**: Admin or higher
- **Create**: Any authenticated user (validated structure)
- **Update/Delete**: Always denied (immutable)
- Validates required fields: `type`, `action`, `entityId`, `modifiedBy`, `date`
- Validates `type` ∈ `['user', 'banner', 'contact', 'animal', 'config']`
- Validates `action` ∈ `['create', 'update', 'delete']`

### 6. `authorizedEmails` — User management

- **Read**: Public (needed for auth flow)
- **Create**: Superadmin can create any role. Admin can create non-privileged roles only (rescatista, user)
- **Update**: Superadmin can update any user. Admin can update non-privileged users and cannot promote to privileged roles
- **Delete**: Superadmin only
- Validates `email == emailId` to prevent document ID mismatches

### 7. `banners` — Carousel banners

- **Read**: Public (displayed on the site)
- **Write**: Admin or higher

### 8. `dashboardAnalytics` — Dashboard data

- **Read**: Public (enables server-side caching via `'use cache'`)
- **Write**: Rescuer or higher (transactions write analytics data)

## Testing

After deploying the rules, verify with:

```javascript
// Should succeed — anyone reading animals
firebase.firestore().collection('animals').get();

// Should succeed — admin reading audit logs
firebase.firestore().collection('systemAuditLog').get();

// Should succeed — creating an audit log (authenticated)
firebase.firestore().collection('systemAuditLog').add({
  type: 'user',
  action: 'create',
  entityId: 'test@example.com',
  modifiedBy: 'admin@example.com',
  date: Date.now(),
});

// Should fail — updating an audit log
firebase.firestore().collection('systemAuditLog').doc('logId').update({});

// Should fail — deleting an audit log
firebase.firestore().collection('systemAuditLog').doc('logId').delete();

// Should fail — non-admin deleting authorized email
firebase.firestore().collection('authorizedEmails').doc('user@example.com').delete();
```

## Related Files

- `/src/types.tsx` — `SystemAuditLog`, `AuditLogType`, `AuditAction` interfaces
- `/src/lib/firebase/createAuditLog.ts` — Helper function to create audit logs
- `/src/lib/permissions.ts` — Client-side permission checking functions
- `/src/contexts/AuthContext.tsx` — Authentication context with role helpers
