# Firestore Security Rules for Audit Log System

## Overview

This document contains the Firestore security rules that need to be added to enable the audit log system. These rules ensure that audit logs are:

- Only readable by admins and superadmins
- Created with validated data structure
- Immutable once created (no updates or deletes)

## Rules to Add

Add the following rules to your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

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

    // Helper function to get user role from authorizedEmails collection
    function getUserRole() {
      return get(/databases/$(database)/documents/authorizedEmails/$(request.auth.token.email)).data.role;
    }

    // Helper function to check if user is admin or higher
    function isAdmin() {
      return isAuthenticated() && getRoleLevel(getUserRole()) >= 3;
    }

    // System Audit Log Collection
    // Tracks all changes made to entities in the system
    match /systemAuditLog/{logId} {
      // Read: Only admins and superadmins can read audit logs
      allow read: if isAdmin();

      // Create: Only authenticated users can create audit logs
      // Validate data structure and ensure required fields are present
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['type', 'action', 'entityId', 'modifiedBy', 'date'])
        && request.resource.data.type in ['user', 'banner', 'contact', 'animal', 'config']
        && request.resource.data.action in ['create', 'update', 'delete']
        && request.resource.data.entityId is string
        && request.resource.data.modifiedBy is string
        && request.resource.data.date is number
        && request.resource.data.date > 0;

      // Update/Delete: Never allowed - audit logs are immutable
      allow update, delete: if false;
    }

    // ... (other collection rules remain unchanged)
  }
}
```

## Rule Explanation

### Read Access

- Only users with `admin` or `superadmin` roles can read audit logs
- Uses `isAdmin()` helper function to check role hierarchy

### Create Access

- Any authenticated user can create audit logs (system operations)
- Validates required fields:
  - `type`: Must be one of: 'user', 'banner', 'contact', 'animal', 'config'
  - `action`: Must be one of: 'create', 'update', 'delete'
  - `entityId`: Must be a string (ID of the modified entity)
  - `modifiedBy`: Must be a string (ID of the user making the change)
  - `date`: Must be a positive number (timestamp)
- Optional fields (`entityName`, `modifiedByName`, `changes`, `metadata`) are not validated but allowed

### Update/Delete Access

- **Always denied** - audit logs are immutable once created
- This ensures the integrity of the audit trail

## Implementation

1. Go to Firebase Console → Firestore Database → Rules
2. Add the `systemAuditLog` match block to your existing rules
3. Ensure the helper functions (`getRoleLevel`, `isAuthenticated`, `getUserRole`, `isAdmin`) are present
4. Publish the rules

## Testing

After deploying the rules, test with:

```javascript
// Should succeed - admin reading logs
firebase.firestore().collection('systemAuditLog').get()

// Should succeed - creating a log
firebase.firestore().collection('systemAuditLog').add({
  type: 'user',
  action: 'create',
  entityId: 'test@example.com',
  modifiedBy: 'admin@example.com',
  date: Date.now()
})

// Should fail - updating a log
firebase.firestore().collection('systemAuditLog').doc('logId').update({ ... })

// Should fail - deleting a log
firebase.firestore().collection('systemAuditLog').doc('logId').delete()
```

## Related Files

- `/src/types.tsx`: SystemAuditLog interface definition
- `/src/lib/firebase/createAuditLog.ts`: Helper function to create audit logs
- `/src/app/plam-admin/usuarios/page.tsx`: User delete with audit logging
- `/src/app/plam-admin/usuarios/crear/page.tsx`: User create with audit logging
- `/src/app/plam-admin/usuarios/editar/[id]/page.tsx`: User edit with audit logging
