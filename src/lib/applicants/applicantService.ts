/**
 * Applicant profile service (client-side).
 *
 * Reusable operations on applicant profiles ("fichas de postulante") that are
 * shared across the admin UI: editing the canonical name, adding/correcting a
 * contact, and merging two profiles. These are distinct from the server-only
 * identity resolution pipeline in `identity.ts`, which handles the automatic
 * creation/linking that happens when a form is ingested.
 *
 * Every mutation writes an audit log (best-effort).
 *
 * NOTE on the reverse contact index: the index (`applicantContactIndex`) is
 * keyed by an HMAC that requires the server-only `APPLICANT_INDEX_SECRET`,
 * which is deliberately not available in the browser. For that reason this
 * client service only updates the inline `contacts` array on the profile. The
 * reverse index is (re)built by the server identity pipeline and the future
 * backfill task, which can hash contacts without exposing the secret.
 */
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { logger } from '@/lib/logger';
import { normalizeEmail, normalizePhone } from '@/lib/applicants/contacts';
import type {
  ApplicantContact,
  ApplicantProfile,
  AnimalTransactionType,
  GoogleFormEntry,
} from '@/types';

export const APPLICANT_PROFILES_COLLECTION = 'applicantProfiles';

/**
 * Builds a normalized `ApplicantContact` from a raw contact value and merges it
 * into an existing contact list. Used when an admin adds or corrects a contact
 * manually (outside of a form submission).
 *
 * @param existing - The current contacts array on the profile
 * @param type - Contact kind ('email' or 'phone')
 * @param rawValue - The value as entered by the admin
 * @param formId - Source recorded on the contact (optional)
 * @returns The contact list with the new/corrected contact merged in
 */
export function upsertContact(
  existing: ApplicantContact[],
  type: 'email' | 'phone',
  rawValue: string,
  formId?: string
): ApplicantContact[] {
  const normalizedValue = type === 'email' ? normalizeEmail(rawValue) : normalizePhone(rawValue);
  const nowIso = new Date().toISOString();
  const trimmed = String(rawValue).trim();

  if (!normalizedValue) {
    throw new Error(`No se pudo normalizar el ${type === 'email' ? 'email' : 'teléfono'}.`);
  }

  const matchIndex = existing.findIndex(
    (entry) => entry.type === type && entry.normalizedValue === normalizedValue
  );

  if (matchIndex === -1) {
    return [
      ...existing,
      {
        type,
        value: trimmed,
        normalizedValue,
        labels: ['manual'],
        sourceFormIds: formId ? [formId] : [],
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
      },
    ];
  }

  const current = existing[matchIndex];
  const next = [...existing];
  next[matchIndex] = {
    ...current,
    value: trimmed,
    labels: current.labels.includes('manual') ? current.labels : [...current.labels, 'manual'],
    sourceFormIds:
      formId && !current.sourceFormIds.includes(formId)
        ? [...current.sourceFormIds, formId]
        : current.sourceFormIds,
    lastSeenAt: nowIso,
  };
  return next;
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
      nameAliases: nextAliases,
      updatedAt: new Date().toISOString(),
    },
    currentCollection: 'applicantProfiles',
    id: profile.id,
  });
}

/**
 * Adds or corrects a contact on an applicant profile (manual admin action).
 *
 * NOTE: only the inline `contacts` array is updated here. The reverse index is
 * not touched because hashing requires the server-only `APPLICANT_INDEX_SECRET`
 * (see module docstring). A future form submission carrying this contact, or
 * the backfill task, will re-link the index on the server.
 *
 * @param profile - The profile being edited
 * @param type - Contact kind ('email' or 'phone')
 * @param rawValue - The contact value entered by the admin
 * @param actor - { id, name } of the user performing the edit
 */
export async function addApplicantContact(
  profile: ApplicantProfile,
  type: 'email' | 'phone',
  rawValue: string,
  actor: { id: string; name: string }
): Promise<void> {
  const nextContacts = upsertContact(profile.contacts ?? [], type, rawValue);

  await createAuditLog({
    type: 'applicant',
    action: 'update',
    entityId: profile.id,
    entityName: profile.canonicalName ?? profile.id,
    modifiedBy: actor.id,
    modifiedByName: actor.name,
    changes: {
      before: { contactCount: profile.contacts?.length ?? 0 },
      after: { contactCount: nextContacts.length, addedContactType: type },
    },
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      contacts: nextContacts,
      updatedAt: new Date().toISOString(),
    },
    currentCollection: 'applicantProfiles',
    id: profile.id,
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
  // that are not already present (by type+normalizedValue).
  const combinedContacts = [...(target.contacts ?? [])];
  const seen = new Set(
    combinedContacts.map((contact) => `${contact.type}:${contact.normalizedValue}`)
  );
  for (const contact of source.contacts ?? []) {
    const key = `${contact.type}:${contact.normalizedValue}`;
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
      nameAliases: combinedAliases,
      notes: combinedNotes,
      formsCount: (target.formsCount ?? 0) + (source.formsCount ?? 0),
      adoptionCount: (target.adoptionCount ?? 0) + (source.adoptionCount ?? 0),
      returnCount: (target.returnCount ?? 0) + (source.returnCount ?? 0),
      identityStatus: mergedIdentityStatus,
      updatedAt: nowIso,
    },
    currentCollection: 'applicantProfiles',
    id: target.id,
  });

  await postFirestoreData<Partial<ApplicantProfile>>({
    data: {
      identityStatus: 'merged' as const,
      mergedInto: target.id,
      updatedAt: nowIso,
    },
    currentCollection: 'applicantProfiles',
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

  logger({
    level: 'info',
    code: 'APPLICANT_MERGED',
    message: `Merged applicant ${source.id} into ${target.id}`,
    data: { formsMoved: sourceForms.length, transactionsMoved: sourceTransactions.length },
  });
}
