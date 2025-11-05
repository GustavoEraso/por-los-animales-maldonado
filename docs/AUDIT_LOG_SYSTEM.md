# Audit Log System

## Overview

The audit log system automatically tracks all changes made to system entities (users, banners, contacts, animals, configurations). These records are immutable and can only be queried by administrators.

## Features

### 🔒 Security

- Logs are **immutable** - they cannot be edited or deleted once created
- Only admins and superadmins can read the logs
- Automatic validation of data structure in Firestore

### 📊 Information Recorded

- **Entity type** modified (user, banner, contact, animal, config)
- **Action** performed (create, update, delete)
- **ID and name** of the modified entity
- **User** who made the change (ID and name)
- **Precise timestamp** of the modification
- **Specific changes** (before and after state)
- **Additional metadata** (optional)

### 🚀 Technical Features

- Does not block main operations if it fails
- Asynchronous log creation
- Transparent integration with existing CRUD operations

## Data Structure

### TypeScript Types

```typescript
// Auditable entity types
export type AuditLogType = 'user' | 'banner' | 'contact' | 'animal' | 'config';

// Actions that can be audited
export type AuditAction = 'create' | 'update' | 'delete';

// Audit log record structure
export interface SystemAuditLog {
  id: string; // Firestore document ID
  type: AuditLogType; // Entity type
  action: AuditAction; // Action performed
  entityId: string; // Modified entity ID
  entityName?: string; // Human-readable entity name
  modifiedBy: string; // User ID who made the change
  modifiedByName?: string; // User name
  date: number; // Timestamp (milliseconds)
  changes?: {
    // Changes made
    before?: Record<string, unknown>; // State before
    after?: Record<string, unknown>; // State after
  };
  metadata?: Record<string, unknown>; // Additional information
}
```

## Usage

### Main Function: `createAuditLog`

```typescript
import { createAuditLog } from '@/lib/firebase/createAuditLog';

// Example: Delete user
await createAuditLog({
  type: 'user',
  action: 'delete',
  entityId: 'user@example.com',
  entityName: 'Juan Pérez',
  modifiedBy: currentUser.id,
  modifiedByName: currentUser.name,
  changes: {
    before: {
      name: 'Juan Pérez',
      role: 'rescatista',
    },
  },
});

// Example: Create user
await createAuditLog({
  type: 'user',
  action: 'create',
  entityId: 'newuser@example.com',
  entityName: 'María García',
  modifiedBy: currentUser.id,
  modifiedByName: currentUser.name,
  changes: {
    after: {
      name: 'María García',
      role: 'rescatista',
    },
  },
});

// Example: Update user
await createAuditLog({
  type: 'user',
  action: 'update',
  entityId: 'user@example.com',
  entityName: 'Juan Pérez',
  modifiedBy: currentUser.id,
  modifiedByName: currentUser.name,
  changes: {
    before: { role: 'rescatista' },
    after: { role: 'admin' },
  },
});
```

## Current Implementation

### Implemented Modules

#### ✅ User Management

- **Create user** (`/plam-admin/usuarios/crear`)
  - Records creation with new user data
- **Edit user** (`/plam-admin/usuarios/editar/[id]`)
  - Records only changed fields using `getChangedFields`
  - Compares before vs. after state
- **Delete user** (`/plam-admin/usuarios`)
  - Records user data before deletion

### Implementation Pattern

```typescript
// 1. Create audit log BEFORE the main operation
await createAuditLog({ ... });

// 2. Perform the main operation
await handlePromiseToast(
  deleteFirestoreData({ ... }),
  { messages: { ... } }
);

// 3. Update UI / redirect
await fetchUsers();
```

**Important:** The audit log is created **before** the main operation to:

- Ensure it's recorded even if something fails afterward
- Have complete data available before any change
- Not lose information if the main operation fails

## Future Implementations

### Pending Implementation

#### 📝 Banner Management

- Create banner → record new banner data
- Edit banner → record changes in title, image, URL, etc.
- Delete banner → record deleted banner data

#### 📞 Contact Management

- Create contact → record new contact data
- Edit contact → record changes in name, phone, area, etc.
- Delete contact → record deleted contact data

#### 🐾 Animal Management

- Create animal → record new animal data
- Edit animal → record changes in status, information, photos, etc.
- Delete animal → record deleted animal data
- Status change → record transition (available → adopted)

#### ⚙️ System Configuration

- Changes in general configuration
- System parameter modifications

## Querying Logs

### Firestore Console

Logs are stored in the `systemAuditLog` collection and can be queried directly from the Firebase console.

### Recommended Filters

```javascript
// Search by entity type
collection('systemAuditLog').where('type', '==', 'user');

// Search by action
collection('systemAuditLog').where('action', '==', 'delete');

// Search by user who made the change
collection('systemAuditLog').where('modifiedBy', '==', 'admin@example.com');

// Search by specific entity
collection('systemAuditLog').where('entityId', '==', 'user@example.com');

// Search by date range
collection('systemAuditLog')
  .where('date', '>=', startTimestamp)
  .where('date', '<=', endTimestamp)
  .orderBy('date', 'desc');
```

### Admin View (Future)

An admin page can be created at `/plam-admin/audit-logs` that displays:

- Table with all logs
- Filters by type, action, user, date
- Entity search
- CSV/Excel export
- Change visualization (diff viewer)

## Firestore Rules

Security rules are documented in `docs/FIRESTORE_AUDIT_LOG_RULES.md` and must be configured in Firebase Console.

### Key Points

- ✅ Only admins can read logs
- ✅ Authenticated users can create logs (validated)
- ❌ No one can update or delete logs (immutable)

## Related Files

### Types and Utilities

- `/src/types.tsx` - TypeScript type definitions
- `/src/lib/firebase/createAuditLog.ts` - Helper function to create logs
- `/src/lib/getChangedFields.ts` - Utility to compare objects

### Pages with Audit

- `/src/app/plam-admin/usuarios/page.tsx` - User list and deletion
- `/src/app/plam-admin/usuarios/crear/page.tsx` - User creation
- `/src/app/plam-admin/usuarios/editar/[id]/page.tsx` - User editing

### Documentation

- `/docs/FIRESTORE_AUDIT_LOG_RULES.md` - Detailed Firestore rules
- `/docs/AUDIT_LOG_SYSTEM.md` - This document

## Best Practices

### When Implementing Audit in New Modules

1. **Import the function**

   ```typescript
   import { createAuditLog } from '@/lib/firebase/createAuditLog';
   import { useAuth } from '@/contexts/AuthContext';
   ```

2. **Get current user information**

   ```typescript
   const { currentUser } = useAuth();
   ```

3. **Create the log BEFORE the operation**

   ```typescript
   if (currentUser) {
     await createAuditLog({
       type: 'banner',
       action: 'delete',
       entityId: banner.id,
       entityName: banner.title,
       modifiedBy: currentUser.id,
       modifiedByName: currentUser.name,
       changes: {
         before: {
           title: banner.title,
           imageUrl: banner.imageUrl,
         },
       },
     });
   }
   ```

4. **Don't catch audit log errors**
   - The `createAuditLog` function handles its own errors
   - Doesn't throw exceptions that could interrupt the main flow
   - Only logs errors to console

5. **Include relevant information**
   - `entityName` helps quickly identify the entity
   - `changes` allows seeing exactly what changed
   - `metadata` can include additional context information

## Maintenance

### Cleaning Old Logs

Logs accumulate indefinitely. For high-activity systems, consider:

- Scheduled Cloud Functions to archive old logs
- Periodic export to BigQuery for analysis
- Retention policies in Firestore (requires Cloud Functions)

### Monitoring

- Regularly verify that logs are being created
- Review error logs in browser console
- Monitor collection size in Firebase

## Support

For questions or issues with the audit system:

1. Review this document and `FIRESTORE_AUDIT_LOG_RULES.md`
2. Verify that Firestore rules are up to date
3. Check user permissions in `authorizedEmails` collection
4. Review browser console logs for errors

---

**Last updated:** 2024
**Version:** 1.0.0
