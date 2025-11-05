import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { AuditAction, AuditLogType, SystemAuditLog } from '@/types';

/**
 * Creates an audit log entry in Firestore
 *
 * @param {Object} params - Audit log parameters
 * @param {AuditLogType} params.type - Type of entity being audited
 * @param {AuditAction} params.action - Action performed on the entity
 * @param {string} params.entityId - ID of the entity
 * @param {string} [params.entityName] - Human-readable name of the entity
 * @param {string} params.modifiedBy - ID of the user performing the action
 * @param {string} [params.modifiedByName] - Name of the user performing the action
 * @param {Object} [params.changes] - Changes made to the entity
 * @param {Record<string, unknown>} [params.changes.before] - State before the change
 * @param {Record<string, unknown>} [params.changes.after] - State after the change
 * @param {Record<string, unknown>} [params.metadata] - Additional metadata
 * @returns {Promise<string>} The ID of the created audit log entry
 * @throws {Error} If the audit log cannot be created
 *
 * @example
 * await createAuditLog({
 *   type: 'user',
 *   action: 'delete',
 *   entityId: 'user123',
 *   entityName: 'John Doe',
 *   modifiedBy: 'admin123',
 *   modifiedByName: 'Admin User'
 * });
 */
export async function createAuditLog({
  type,
  action,
  entityId,
  entityName,
  modifiedBy,
  modifiedByName,
  changes,
  metadata,
}: {
  type: AuditLogType;
  action: AuditAction;
  entityId: string;
  entityName?: string;
  modifiedBy: string;
  modifiedByName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    // Build audit log data, only including fields that are defined
    const auditLogData: Record<string, unknown> = {
      type,
      action,
      entityId,
      modifiedBy,
      date: Date.now(),
    };

    // Add optional fields only if they are defined
    if (entityName !== undefined) {
      auditLogData.entityName = entityName;
    }

    if (modifiedByName !== undefined) {
      auditLogData.modifiedByName = modifiedByName;
    }

    if (changes !== undefined && (changes.before !== undefined || changes.after !== undefined)) {
      auditLogData.changes = changes;
    }

    if (metadata !== undefined && Object.keys(metadata).length > 0) {
      auditLogData.metadata = metadata;
    }

    const docRef = await addDoc(collection(db, 'systemAuditLog'), auditLogData);

    return docRef.id;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit log failures shouldn't break the main operation
    return '';
  }
}
