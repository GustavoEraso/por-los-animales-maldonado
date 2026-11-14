/**
 * Applicant profile service (client-side).
 *
 * Reusable operations on applicant profiles ("fichas de postulante") that are
 * shared across the admin UI: editing the canonical name, reviewing the
 * contacts declared in a form, adding/correcting a contact and merging two
 * profiles.
 *
 * Contact policy:
 * - Contacts extracted from a form are stored as `pending` by the identity
 *   pipeline. They are neither indexed nor used for coincidences.
 * - Staff confirms each contact from the ficha. Only confirmed contacts are
 *   normalized and written to `applicantContactIndex`.
 * - The login email is the only contact indexed automatically (it comes
 *   verified by Google).
 *
 * Every mutation writes an audit log (best-effort).
 */
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { logger } from '@/lib/logger';
import { sumApplicantCounts } from '@/lib/applicants/counts';
import {
  applicantContactKey,
  contactIndexDocId,
  getApplicantContactKind,
  getApplicantContactStatus,
  getContactTypeFromKind,
  isIndexableContactKind,
  normalizeApplicantSearchName,
  normalizeContactValue,
} from '@/lib/applicants/contacts';
import type {
  ApplicantContact,
  ApplicantContactIndexEntry,
  ApplicantContactKind,
  ApplicantProfile,
  AnimalTransactionType,
  GoogleFormEntry,
} from '@/types';

export const APPLICANT_PROFILES_COLLECTION = 'applicantProfiles';
export const APPLICANT_CONTACT_INDEX_COLLECTION = 'applicantContactIndex';

/** A confirmed contact that is already used by another profile. */
export interface ContactConflict {
  type: 'email' | 'phone';
  /** Normalized contact value. */
  value: string;
  /** Every profile that currently uses the contact. */
  applicantIds: string[];
}

/** Result of confirming one pending contact. */
export interface ConfirmApplicantContactResult {
  contacts: ApplicantContact[];
  conflicts: ContactConflict[];
}

/** Value accepted by staff when confirming a pending contact. */
export interface ReviewedContactValue {
  value: string;
  kind: ApplicantContactKind;
  label?: string;
}

/** Contact captured in an adoption/return form. */
export interface TransactionContactInput {
  type: ApplicantContactKind;
  value: string | number;
  label?: string;
}

function mergeLabels(current: string[], incoming: string[]): string[] {
  return [...new Set([...current, ...incoming])];
}

function mergeConfirmedContact(
  existing: ApplicantContact[],
  incoming: ApplicantContact
): ApplicantContact[] {
  const matchIndex = existing.findIndex((entry) => {
    if (getApplicantContactStatus(entry) !== 'confirmed') return false;
    if (entry.type !== incoming.type) return false;
    if (incoming.normalizedValue) {
      return entry.normalizedValue === incoming.normalizedValue;
    }
    return entry.value.trim().toLowerCase() === incoming.value.trim().toLowerCase();
  });

  if (matchIndex === -1) {
    return [...existing, incoming];
  }

  const current = existing[matchIndex];
  const nextKind = incoming.kind ?? current.kind;
  const nextLabel = incoming.label ?? current.label;
  const nextNormalizedValue = incoming.normalizedValue ?? current.normalizedValue;

  const updated: ApplicantContact = {
    ...current,
    value: incoming.value || current.value,
    ...(nextKind ? { kind: nextKind } : {}),
    ...(nextLabel ? { label: nextLabel } : {}),
    ...(nextNormalizedValue ? { normalizedValue: nextNormalizedValue } : {}),
    labels: mergeLabels(current.labels, incoming.labels),
    sourceFormIds: [...new Set([...current.sourceFormIds, ...incoming.sourceFormIds])],
    lastSeenAt: incoming.lastSeenAt,
    confirmationStatus: 'confirmed',
    confirmedBy: current.confirmedBy ?? incoming.confirmedBy,
    confirmedAt: current.confirmedAt ?? incoming.confirmedAt,
  };

  const result = [...existing];
  result[matchIndex] = updated;
  return result;
}

function matchesContact(entry: ApplicantContact, contact: ApplicantContact): boolean {
  return applicantContactKey(entry) === applicantContactKey(contact);
}

function reviewedValueKey(
  type: 'email' | 'phone',
  normalizedValue: string | null,
  rawValue: string
): string {
  return normalizedValue ? `${type}:${normalizedValue}` : `${type}:raw:${rawValue.toLowerCase()}`;
}

/**
 * Builds a confirmed `ApplicantContact` from a raw value and merges it into an
 * existing contact list. Used for manual additions by staff and for contacts
 * copied from adoption/return forms.
 *
 * @param existing - The current contacts array on the profile
 * @param kind - User-facing contact kind (celular, email or other)
 * @param rawValue - The value as entered by staff
 * @param options - Optional source form, actor, label and source label
 * @returns The contact list with the new/corrected contact merged in
 */
export function upsertContact(
  existing: ApplicantContact[],
  kind: ApplicantContactKind,
  rawValue: string,
  options?: {
    formId?: string;
    actor?: { id: string; name: string };
    label?: string;
    sourceLabel?: string;
  }
): ApplicantContact[] {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error('El valor del contacto no puede estar vacío.');
  }

  const type = getContactTypeFromKind(kind);
  const indexable = isIndexableContactKind(kind);
  const normalizedValue = indexable ? normalizeContactValue(type, trimmed) : null;
  if (indexable && !normalizedValue) {
    throw new Error(`No se pudo normalizar el ${type === 'email' ? 'email' : 'teléfono'}.`);
  }

  const nowIso = new Date().toISOString();
  const incoming: ApplicantContact = {
    type,
    kind,
    ...(options?.label?.trim() ? { label: options.label.trim() } : {}),
    value: trimmed,
    ...(normalizedValue ? { normalizedValue } : {}),
    confirmationStatus: 'confirmed',
    confirmedBy: options?.actor?.id ?? 'manual',
    confirmedAt: nowIso,
    labels: [options?.sourceLabel ?? 'manual'],
    sourceFormIds: options?.formId ? [options.formId] : [],
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
  };

  return mergeConfirmedContact(existing, incoming);
}

/**
 * Edits the canonical name of an applicant profile.
 *
 * @param profile - The profile being edited
 * @param newName - The new canonical name
 * @param actor - { id, name } of the user performing the edit
 */
export async function editApplicantName(
  profile: ApplicantProfile,
  newName: string,
  actor: { id: string; name: string }
): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error('El nombre no puede estar vacío.');
  }

  const currentAliases = new Set(profile.nameAliases ?? []);
  const nextAliases = currentAliases.has(trimmed)
    ? [...currentAliases]
    : [...currentAliases, trimmed];

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { canonicalName: profile.canonicalName ?? null },
      after: { canonicalName: trimmed },
    },
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      canonicalName: trimmed,
      searchName: normalizeApplicantSearchName(trimmed),
      nameAliases: nextAliases,
      updatedAt: new Date().toISOString(),
    },
    currentCollection: APPLICANT_PROFILES_COLLECTION,
    id: profile.id,
  });
}

/**
 * Resolves a pending identity review and moves the profile back to `active`.
 *
 * The profile may still be blacklisted: the review and the blacklist are
 * independent states. Resolving the review never clears the blacklist.
 *
 * @param profile - Profile that is in `needs_review`
 * @param note - Optional note left by the reviewer
 * @param actor - { id, name } of the user resolving the review
 */
export async function resolveApplicantReview(
  profile: ApplicantProfile,
  note: string,
  actor: { id: string; name: string }
): Promise<void> {
  if (profile.identityStatus !== 'needs_review') {
    throw new Error('La ficha no está pendiente de revisión.');
  }

  const nowIso = new Date().toISOString();
  const trimmedNote = note.trim();

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: {
        identityStatus: profile.identityStatus,
        identityReviewReason: profile.identityReviewReason ?? null,
      },
      after: {
        identityStatus: 'active',
        identityReviewNote: trimmedNote || null,
        identityReviewedAt: nowIso,
        identityReviewedBy: actor.id,
      },
    },
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      identityStatus: 'active',
      identityReviewReason: null,
      identityReviewNote: trimmedNote || null,
      identityReviewedAt: nowIso,
      identityReviewedBy: actor.id,
      updatedAt: nowIso,
    },
    currentCollection: APPLICANT_PROFILES_COLLECTION,
    id: profile.id,
  });
}

/**
 * Adds or corrects a contact on an applicant profile (manual admin action).
 *
 * Manual contacts are considered confirmed by definition. `celular` and
 * `email` contacts are normalized and indexed immediately; `other` contacts
 * are stored for display only (no index).
 *
 * @param profile - The profile being edited
 * @param kind - User-facing contact kind (celular, email or other)
 * @param rawValue - The contact value entered by the admin
 * @param label - Optional user-facing label (e.g. "Pareja")
 * @param actor - { id, name } of the user performing the edit
 * @returns The updated contact list
 */
export async function addApplicantContact(
  profile: ApplicantProfile,
  kind: ApplicantContactKind,
  rawValue: string,
  label: string,
  actor: { id: string; name: string }
): Promise<ApplicantContact[]> {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error('El valor del contacto no puede estar vacío.');
  }

  const type = getContactTypeFromKind(kind);
  const indexable = isIndexableContactKind(kind);
  const normalizedValue = indexable ? normalizeContactValue(type, trimmed) : null;
  if (indexable && !normalizedValue) {
    throw new Error(`No se pudo normalizar el ${type === 'email' ? 'email' : 'teléfono'}.`);
  }

  const nowIso = new Date().toISOString();
  const indexId = normalizedValue ? contactIndexDocId({ type, normalizedValue }) : null;
  const previewContacts = upsertContact(profile.contacts ?? [], kind, trimmed, {
    actor,
    label,
  });

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contactCount: profile.contacts?.length ?? 0 },
      after: {
        contactCount: previewContacts.length,
        addedContactKind: kind,
        addedContactLabel: label.trim() || null,
      },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }

    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const nextContacts = upsertContact(currentProfile.contacts ?? [], kind, trimmed, {
      actor,
      label,
    });

    if (indexId) {
      const indexRef = doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, indexId);
      const indexSnapshot = await transaction.get(indexRef);
      const existingIndex = indexSnapshot.exists()
        ? (indexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>)
        : null;
      const currentIds = existingIndex?.applicantIds ?? [];
      const nextIds = currentIds.includes(profile.id) ? currentIds : [...currentIds, profile.id];

      transaction.set(
        indexRef,
        {
          type,
          applicantIds: nextIds,
          conflict: nextIds.length > 1,
          firstSeenAt: existingIndex?.firstSeenAt ?? nowIso,
          lastSeenAt: nowIso,
        },
        { merge: true }
      );
    }

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });

    return nextContacts;
  });
}

/**
 * Edits an existing confirmed contact (kind, label and/or value).
 *
 * Re-indexes the contact when needed: removes the old index entry and writes
 * the new one. `other` contacts are visible-only and are never indexed.
 *
 * @param params.profile - Profile that owns the contact
 * @param params.contact - Contact as currently stored (used to locate it)
 * @param params.kind - New user-facing kind
 * @param params.rawValue - New value entered by staff
 * @param params.label - New optional label
 * @param params.actor - { id, name } of the user editing the contact
 * @returns The updated contact list
 */
export async function updateApplicantContact(params: {
  profile: ApplicantProfile;
  contact: ApplicantContact;
  kind: ApplicantContactKind;
  rawValue: string;
  label: string;
  actor: { id: string; name: string };
}): Promise<ApplicantContact[]> {
  const { profile, contact, kind, rawValue, label, actor } = params;
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error('El valor del contacto no puede estar vacío.');
  }
  if (getApplicantContactStatus(contact) !== 'confirmed') {
    throw new Error('Solo se pueden editar contactos confirmados.');
  }
  if (contact.labels?.includes('googleAccountEmail')) {
    throw new Error('El email automático de Google no se puede editar.');
  }

  const oldKind = getApplicantContactKind(contact);
  const oldType = getContactTypeFromKind(oldKind);
  const oldIndexable = isIndexableContactKind(oldKind) && Boolean(contact.normalizedValue);
  const newType = getContactTypeFromKind(kind);
  const newIndexable = isIndexableContactKind(kind);
  const normalizedValue = newIndexable ? normalizeContactValue(newType, trimmed) : null;
  if (newIndexable && !normalizedValue) {
    throw new Error(`No se pudo normalizar el ${newType === 'email' ? 'email' : 'teléfono'}.`);
  }

  const nowIso = new Date().toISOString();
  const oldIndexId =
    oldIndexable && contact.normalizedValue
      ? contactIndexDocId({ type: oldType, normalizedValue: contact.normalizedValue })
      : null;
  const newIndexId = normalizedValue ? contactIndexDocId({ type: newType, normalizedValue }) : null;
  const indexChanged = oldIndexId !== newIndexId;

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: {
        value: contact.value,
        kind: oldKind,
        label: contact.label ?? null,
      },
      after: {
        value: trimmed,
        kind,
        label: label.trim() || null,
      },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }

    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const currentContacts = currentProfile.contacts ?? [];
    const contactExists = currentContacts.some((entry) => matchesContact(entry, contact));
    if (!contactExists) {
      throw new Error('El contacto ya no existe. Recargá la ficha.');
    }

    // Firestore requires every read before the first write.
    const oldIndexRef = oldIndexId ? doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, oldIndexId) : null;
    const newIndexRef = newIndexId ? doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, newIndexId) : null;
    const oldIndexSnapshot = oldIndexRef ? await transaction.get(oldIndexRef) : null;
    const newIndexSnapshot =
      newIndexRef && indexChanged ? await transaction.get(newIndexRef) : oldIndexSnapshot;

    // Build the updated contact without carrying removed optional fields.
    const {
      label: _previousLabel,
      normalizedValue: _previousNormalizedValue,
      ...baseContact
    } = contact;
    const updatedContact: ApplicantContact = {
      ...baseContact,
      type: newType,
      kind,
      ...(label.trim() ? { label: label.trim() } : {}),
      value: trimmed,
      ...(normalizedValue ? { normalizedValue } : {}),
      confirmationStatus: 'confirmed',
      confirmedBy: actor.id,
      confirmedAt: nowIso,
      lastSeenAt: nowIso,
    };

    const nextContacts = mergeConfirmedContact(
      currentContacts.filter((entry) => !matchesContact(entry, contact)),
      updatedContact
    );

    if (oldIndexRef && indexChanged && oldIndexSnapshot?.exists()) {
      const existingIndex = oldIndexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>;
      const nextIds = (existingIndex.applicantIds ?? []).filter((id) => id !== profile.id);
      if (nextIds.length === 0) {
        transaction.delete(oldIndexRef);
      } else {
        transaction.set(
          oldIndexRef,
          {
            applicantIds: nextIds,
            conflict: nextIds.length > 1,
            lastSeenAt: nowIso,
          },
          { merge: true }
        );
      }
    }

    if (newIndexRef && indexChanged) {
      const existingIndex = newIndexSnapshot?.exists()
        ? (newIndexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>)
        : null;
      const currentIds = existingIndex?.applicantIds ?? [];
      const nextIds = currentIds.includes(profile.id) ? currentIds : [...currentIds, profile.id];

      transaction.set(
        newIndexRef,
        {
          type: newType,
          applicantIds: nextIds,
          conflict: nextIds.length > 1,
          firstSeenAt: existingIndex?.firstSeenAt ?? nowIso,
          lastSeenAt: nowIso,
        },
        { merge: true }
      );
    }

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });
    return nextContacts;
  });
}

/**
 * Copies the contacts captured in an adoption/return form to the applicant
 * profile. They are staff-entered, so they are stored as confirmed. `other`
 * contacts are visible-only and are not indexed.
 *
 * @param params.applicantId - Applicant profile linked to the transaction
 * @param params.contacts - Contacts captured in the form
 * @param params.actor - Staff member registering the transaction
 * @param params.formId - Optional source form id
 * @returns The updated contact list
 */
export async function syncApplicantContactsFromTransaction(params: {
  applicantId: string;
  contacts: TransactionContactInput[];
  actor: { id: string; name: string };
  formId?: string;
}): Promise<ApplicantContact[]> {
  const { applicantId, contacts, actor, formId } = params;
  const nowIso = new Date().toISOString();

  const reviewedValues: Array<{
    value: string;
    kind: ApplicantContactKind;
    label?: string;
    normalizedValue: string | null;
  }> = [];
  const seenValues = new Set<string>();

  for (const contact of contacts) {
    const value = String(contact.value ?? '').trim();
    if (!value) continue;

    const kind = contact.type;
    const type = getContactTypeFromKind(kind);
    const indexable = isIndexableContactKind(kind);
    const normalizedValue = indexable ? normalizeContactValue(type, value) : null;

    // Invalid indexable contacts are skipped: the transaction is already saved.
    if (indexable && !normalizedValue) continue;

    const dedupeKey = reviewedValueKey(type, normalizedValue, value);
    if (seenValues.has(dedupeKey)) continue;
    seenValues.add(dedupeKey);

    reviewedValues.push({
      value,
      kind,
      ...(contact.label?.trim() ? { label: contact.label.trim() } : {}),
      normalizedValue,
    });
  }

  if (reviewedValues.length === 0) {
    const profileSnapshot = await getFirestoreDocById<ApplicantProfile>({
      currentCollection: APPLICANT_PROFILES_COLLECTION,
      id: applicantId,
    });
    return profileSnapshot?.contacts ?? [];
  }

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: applicantId,
    entityName: applicantId,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { source: 'transaction' },
      after: {
        contacts: reviewedValues.map((entry) => ({
          value: entry.value,
          kind: entry.kind,
          label: entry.label ?? null,
          normalizedValue: entry.normalizedValue,
        })),
      },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha del adoptante ya no existe.');
    }

    const profile = profileSnapshot.data() as ApplicantProfile;

    const indexableValues = reviewedValues.filter(
      (entry): entry is typeof entry & { normalizedValue: string } => entry.normalizedValue !== null
    );
    const indexReads = await Promise.all(
      indexableValues.map(async (reviewed) => {
        const type = getContactTypeFromKind(reviewed.kind);
        const indexRef = doc(
          db,
          APPLICANT_CONTACT_INDEX_COLLECTION,
          contactIndexDocId({ type, normalizedValue: reviewed.normalizedValue })
        );
        const indexSnapshot = await transaction.get(indexRef);
        const existingIndex = indexSnapshot.exists()
          ? (indexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>)
          : null;
        return { reviewed, indexRef, existingIndex };
      })
    );

    let nextContacts = profile.contacts ?? [];

    for (const reviewed of reviewedValues) {
      const type = getContactTypeFromKind(reviewed.kind);
      const incoming: ApplicantContact = {
        type,
        kind: reviewed.kind,
        ...(reviewed.label ? { label: reviewed.label } : {}),
        value: reviewed.value,
        ...(reviewed.normalizedValue ? { normalizedValue: reviewed.normalizedValue } : {}),
        confirmationStatus: 'confirmed',
        confirmedBy: actor.id,
        confirmedAt: nowIso,
        labels: ['transaction'],
        sourceFormIds: formId ? [formId] : [],
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
      };
      nextContacts = mergeConfirmedContact(nextContacts, incoming);
    }

    for (const { reviewed, indexRef, existingIndex } of indexReads) {
      const type = getContactTypeFromKind(reviewed.kind);
      const currentIds = existingIndex?.applicantIds ?? [];
      const nextIds = currentIds.includes(applicantId) ? currentIds : [...currentIds, applicantId];

      transaction.set(
        indexRef,
        {
          type,
          applicantIds: nextIds,
          conflict: nextIds.length > 1,
          firstSeenAt: existingIndex?.firstSeenAt ?? nowIso,
          lastSeenAt: nowIso,
        },
        { merge: true }
      );
    }

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });
    return nextContacts;
  });
}

/**
 * Confirms a pending contact after staff reviewed it.
 *
 * The staff can split one raw field into several values, correct the value,
 * choose the contact kind (celular/otro) and add an optional label. `celular`
 * values are normalized and indexed; `other` values are visible-only.
 *
 * @param params.profile - Profile that owns the pending contact
 * @param params.pendingContact - The pending row being reviewed
 * @param params.values - Values accepted by staff (one per input row)
 * @param params.actor - { id, name } of the user confirming the contact
 * @returns The updated contact list and any coincidences found
 */
export async function confirmApplicantContact(params: {
  profile: ApplicantProfile;
  pendingContact: ApplicantContact;
  values: ReviewedContactValue[];
  actor: { id: string; name: string };
}): Promise<ConfirmApplicantContactResult> {
  const { profile, pendingContact, actor } = params;

  if (pendingContact.type === 'email') {
    throw new Error(
      'Los emails no requieren confirmación. Si es un email viejo, descartalo desde la ficha.'
    );
  }

  const reviewedValues: Array<{
    value: string;
    kind: ApplicantContactKind;
    label?: string;
    normalizedValue: string | null;
  }> = [];
  const seenValues = new Set<string>();

  for (const value of params.values) {
    const trimmed = value.value.trim();
    if (!trimmed) continue;

    const kind = value.kind;
    const type = getContactTypeFromKind(kind);
    const indexable = isIndexableContactKind(kind);
    const normalizedValue = indexable ? normalizeContactValue(type, trimmed) : null;

    if (indexable && !normalizedValue) {
      throw new Error(`"${trimmed}" no es un ${type === 'email' ? 'email' : 'teléfono'} válido.`);
    }

    const dedupeKey = reviewedValueKey(type, normalizedValue, trimmed);
    if (seenValues.has(dedupeKey)) continue;
    seenValues.add(dedupeKey);

    reviewedValues.push({
      value: trimmed,
      kind,
      ...(value.label?.trim() ? { label: value.label.trim() } : {}),
      normalizedValue,
    });
  }

  if (reviewedValues.length === 0) {
    throw new Error('Ingresá al menos un valor para confirmar.');
  }

  const nowIso = new Date().toISOString();

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contact: pendingContact.value, status: 'pending' },
      after: {
        contacts: reviewedValues.map((entry) => ({
          value: entry.value,
          kind: entry.kind,
          label: entry.label ?? null,
          normalizedValue: entry.normalizedValue,
        })),
        status: 'confirmed',
      },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }

    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const currentContacts = currentProfile.contacts ?? [];
    const pendingExists = currentContacts.some((entry) => matchesContact(entry, pendingContact));

    if (!pendingExists) {
      throw new Error('El contacto ya fue procesado. Recargá la ficha.');
    }

    // Firestore requires every read before the first write: resolve the index
    // entries for indexable values first.
    const indexableValues = reviewedValues.filter(
      (entry): entry is typeof entry & { normalizedValue: string } => entry.normalizedValue !== null
    );
    const indexReads = await Promise.all(
      indexableValues.map(async (reviewed) => {
        const type = getContactTypeFromKind(reviewed.kind);
        const indexRef = doc(
          db,
          APPLICANT_CONTACT_INDEX_COLLECTION,
          contactIndexDocId({ type, normalizedValue: reviewed.normalizedValue })
        );
        const indexSnapshot = await transaction.get(indexRef);
        const existingIndex = indexSnapshot.exists()
          ? (indexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>)
          : null;
        return { reviewed, indexRef, existingIndex };
      })
    );

    let nextContacts = currentContacts.filter((entry) => !matchesContact(entry, pendingContact));

    for (const reviewed of reviewedValues) {
      const type = getContactTypeFromKind(reviewed.kind);
      const incoming: ApplicantContact = {
        type,
        kind: reviewed.kind,
        ...(reviewed.label ? { label: reviewed.label } : {}),
        value: reviewed.value,
        ...(reviewed.normalizedValue ? { normalizedValue: reviewed.normalizedValue } : {}),
        confirmationStatus: 'confirmed',
        confirmedBy: actor.id,
        confirmedAt: nowIso,
        labels: pendingContact.labels,
        sourceFormIds: pendingContact.sourceFormIds,
        firstSeenAt: pendingContact.firstSeenAt,
        lastSeenAt: nowIso,
      };
      nextContacts = mergeConfirmedContact(nextContacts, incoming);
    }

    const conflicts: ContactConflict[] = [];

    for (const { reviewed, indexRef, existingIndex } of indexReads) {
      const type = getContactTypeFromKind(reviewed.kind);
      const currentIds = existingIndex?.applicantIds ?? [];
      const nextIds = currentIds.includes(profile.id) ? currentIds : [...currentIds, profile.id];

      transaction.set(
        indexRef,
        {
          type,
          applicantIds: nextIds,
          conflict: nextIds.length > 1,
          firstSeenAt: existingIndex?.firstSeenAt ?? nowIso,
          lastSeenAt: nowIso,
        },
        { merge: true }
      );

      if (nextIds.length > 1) {
        conflicts.push({
          type,
          value: reviewed.normalizedValue,
          applicantIds: nextIds,
        });
      }
    }

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });

    return { contacts: nextContacts, conflicts };
  });
}

/**
 * Marks a pending contact as discarded. Nothing is indexed.
 *
 * @param params.profile - Profile that owns the contact
 * @param params.contact - Contact row being discarded
 * @param params.actor - { id, name } of the user discarding it
 * @returns The updated contact list
 */
export async function discardApplicantContact(params: {
  profile: ApplicantProfile;
  contact: ApplicantContact;
  actor: { id: string; name: string };
}): Promise<ApplicantContact[]> {
  const { profile, contact, actor } = params;
  const nowIso = new Date().toISOString();

  if (contact.labels?.includes('googleAccountEmail')) {
    throw new Error('El email automático de Google no se puede descartar.');
  }

  if (getApplicantContactStatus(contact) === 'confirmed') {
    throw new Error('El contacto ya está confirmado. Usá "Quitar" si querés eliminarlo.');
  }

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contact: contact.value, status: getApplicantContactStatus(contact) },
      after: { contact: contact.value, status: 'discarded' },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }
    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const nextContacts = (currentProfile.contacts ?? []).map((entry) =>
      matchesContact(entry, contact)
        ? {
            ...entry,
            confirmationStatus: 'discarded' as const,
            discardedBy: actor.id,
            discardedAt: nowIso,
            lastSeenAt: nowIso,
          }
        : entry
    );

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });
    return nextContacts;
  });
}

/**
 * Restores a discarded contact to the pending state so staff can review it
 * again.
 *
 * @param params.profile - Profile that owns the contact
 * @param params.contact - Contact row being restored
 * @param params.actor - { id, name } of the user restoring it
 * @returns The updated contact list
 */
export async function restoreApplicantContact(params: {
  profile: ApplicantProfile;
  contact: ApplicantContact;
  actor: { id: string; name: string };
}): Promise<ApplicantContact[]> {
  const { profile, contact, actor } = params;
  const nowIso = new Date().toISOString();

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contact: contact.value, status: 'discarded' },
      after: { contact: contact.value, status: 'pending' },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }
    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const nextContacts = (currentProfile.contacts ?? []).map((entry) =>
      matchesContact(entry, contact)
        ? {
            ...entry,
            confirmationStatus: 'pending' as const,
            discardedBy: null,
            discardedAt: null,
            lastSeenAt: nowIso,
          }
        : entry
    );

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });
    return nextContacts;
  });
}

/**
 * Removes a contact from the profile and, when it was confirmed, from the
 * reverse index.
 *
 * @param params.profile - Profile that owns the contact
 * @param params.contact - Contact row being removed
 * @param params.actor - { id, name } of the user removing it
 * @returns The updated contact list
 */
export async function removeApplicantContact(params: {
  profile: ApplicantProfile;
  contact: ApplicantContact;
  actor: { id: string; name: string };
}): Promise<ApplicantContact[]> {
  const { profile, contact, actor } = params;
  const status = getApplicantContactStatus(contact);
  const nowIso = new Date().toISOString();

  if (contact.labels?.includes('googleAccountEmail')) {
    throw new Error('El email automático de Google no se puede quitar.');
  }

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contact: contact.value, status },
      after: { contact: null },
    },
  });

  return runTransaction(db, async (transaction) => {
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, profile.id);
    const profileSnapshot = await transaction.get(profileRef);
    if (!profileSnapshot.exists()) {
      throw new Error('La ficha ya no existe.');
    }
    const currentProfile = profileSnapshot.data() as ApplicantProfile;
    const nextContacts = (currentProfile.contacts ?? []).filter(
      (entry) => !matchesContact(entry, contact)
    );

    let indexRef: ReturnType<typeof doc> | null = null;
    let indexSnapshot: Awaited<ReturnType<typeof transaction.get>> | null = null;
    if (status === 'confirmed' && contact.normalizedValue) {
      indexRef = doc(
        db,
        APPLICANT_CONTACT_INDEX_COLLECTION,
        contactIndexDocId({
          type: contact.type,
          normalizedValue: contact.normalizedValue,
        })
      );
      indexSnapshot = await transaction.get(indexRef);
    }

    transaction.update(profileRef, { contacts: nextContacts, updatedAt: nowIso });

    if (indexRef && indexSnapshot?.exists()) {
      const existingIndex = indexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>;
      const nextIds = (existingIndex.applicantIds ?? []).filter((id) => id !== profile.id);
      if (nextIds.length === 0) {
        transaction.delete(indexRef);
      } else {
        transaction.set(
          indexRef,
          {
            applicantIds: nextIds,
            conflict: nextIds.length > 1,
            lastSeenAt: nowIso,
          },
          { merge: true }
        );
      }
    }

    return nextContacts;
  });
}

/**
 * Merges a secondary applicant profile into a canonical (surviving) one.
 *
 * The canonical profile absorbs the secondary's forms, adoption/return
 * transactions, contacts (deduplicated), alias names and notes. The secondary
 * profile is kept (never deleted) and marked as `merged` with `mergedInto`
 * pointing at the canonical id so history remains recoverable.
 *
 * @param source - The profile being merged away
 * @param target - The surviving profile
 * @param actor - { id, name } of the user performing the merge
 */
export async function mergeApplicantProfiles(
  source: ApplicantProfile,
  target: ApplicantProfile,
  actor: { id: string; name: string }
): Promise<void> {
  const nowIso = new Date().toISOString();

  const sourceForms = await getFirestoreData({
    currentCollection: 'googleForms',
    filter: [['applicantId', '==', source.id]],
  });

  const sourceTransactions = await getFirestoreData({
    currentCollection: 'animalTransactions',
    filter: [['applicantId', '==', source.id]],
  });

  // Unify contacts: keep target contacts first, then append source contacts
  // that are not already present (by their review-state-aware key).
  const combinedContacts = [...(target.contacts ?? [])];
  const seen = new Set(combinedContacts.map((contact) => applicantContactKey(contact)));
  for (const contact of source.contacts ?? []) {
    const key = applicantContactKey(contact);
    if (!seen.has(key)) {
      combinedContacts.push(contact);
      seen.add(key);
    }
  }

  const combinedAliases = Array.from(
    new Set([...(target.nameAliases ?? []), ...(source.nameAliases ?? [])])
  );
  const combinedNotes = [...(target.notes ?? []), ...(source.notes ?? [])];

  // If either profile is blacklisted, the survivor must be flagged for review
  // so a human makes the final call (per plan section 8.5).
  const targetBlacklisted = target.blacklist?.active ?? false;
  const sourceBlacklisted = source.blacklist?.active ?? false;
  const mergedIdentityStatus: ApplicantProfile['identityStatus'] =
    targetBlacklisted || sourceBlacklisted ? 'needs_review' : 'active';

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: target.id,
    entityName: target.canonicalName ?? target.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    metadata: {
      mergedSourceId: source.id,
      mergedSourceName: source.canonicalName ?? source.id,
      formsMoved: sourceForms.length,
      transactionsMoved: sourceTransactions.length,
    },
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      contacts: combinedContacts,
      searchName: normalizeApplicantSearchName(target.canonicalName ?? ''),
      nameAliases: combinedAliases,
      notes: combinedNotes,
      formsCount: (target.formsCount ?? 0) + (source.formsCount ?? 0),
      adoptionCount: sumApplicantCounts(target.adoptionCount, source.adoptionCount),
      returnCount: sumApplicantCounts(target.returnCount, source.returnCount),
      identityStatus: mergedIdentityStatus,
      ...(mergedIdentityStatus === 'needs_review'
        ? {
            identityReviewReason: 'blacklist_merge' as const,
            identityReviewedAt: null,
            identityReviewedBy: null,
            identityReviewNote: null,
          }
        : { identityReviewReason: null }),
      updatedAt: nowIso,
    },
    currentCollection: APPLICANT_PROFILES_COLLECTION,
    id: target.id,
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      identityStatus: 'merged' as const,
      mergedInto: target.id,
      updatedAt: nowIso,
    },
    currentCollection: APPLICANT_PROFILES_COLLECTION,
    id: source.id,
  });

  // Re-point the source's forms and transactions at the target.
  await Promise.all(
    sourceForms.map(async (form) => {
      await postFirestoreData<Partial<GoogleFormEntry>>({
        data: { applicantId: target.id },
        currentCollection: 'googleForms',
        id: form.id,
      });
    })
  );
  await Promise.all(
    sourceTransactions.map(async (transaction) => {
      await postFirestoreData<Partial<AnimalTransactionType>>({
        data: { applicantId: target.id },
        currentCollection: 'animalTransactions',
        id: transaction.id,
      });
    })
  );

  // Move the reverse-index ownership from the source to the target for every
  // confirmed contact. Pending contacts were never indexed.
  const confirmedContacts = new Map<string, ApplicantContact>();
  for (const contact of combinedContacts) {
    if (
      getApplicantContactStatus(contact) === 'confirmed' &&
      getApplicantContactKind(contact) !== 'other' &&
      contact.normalizedValue
    ) {
      confirmedContacts.set(
        contactIndexDocId({ type: contact.type, normalizedValue: contact.normalizedValue }),
        contact
      );
    }
  }

  await Promise.all(
    [...confirmedContacts.entries()].map(async ([indexId, contact]) => {
      const indexEntry = await getFirestoreDocById<ApplicantContactIndexEntry>({
        currentCollection: APPLICANT_CONTACT_INDEX_COLLECTION,
        id: indexId,
      });
      const currentIds = indexEntry?.applicantIds ?? [];
      const nextIds = Array.from(
        new Set([...currentIds.map((id) => (id === source.id ? target.id : id)), target.id])
      );

      await postFirestoreData<Partial<ApplicantContactIndexEntry>>({
        data: {
          type: contact.type,
          applicantIds: nextIds,
          conflict: nextIds.length > 1,
          firstSeenAt: indexEntry?.firstSeenAt ?? nowIso,
          lastSeenAt: nowIso,
        },
        currentCollection: APPLICANT_CONTACT_INDEX_COLLECTION,
        id: indexId,
      });
    })
  );

  logger({
    level: 'info',
    code: 'APPLICANT_MERGED',
    message: `Merged applicant ${source.id} into ${target.id}`,
    data: { formsMoved: sourceForms.length, transactionsMoved: sourceTransactions.length },
  });
}
