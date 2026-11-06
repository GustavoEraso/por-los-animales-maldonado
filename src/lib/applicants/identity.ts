import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import {
  contactIndexDocId,
  extractPendingPhoneContacts,
  getApplicantContactStatus,
  normalizeApplicantSearchName,
  normalizeContactValue,
  normalizeEmail,
} from '@/lib/applicants/contacts';
import { parseFormDate } from '@/lib/applicants/formDates';
import type { ContactInput, DeclaredContactInput } from '@/lib/applicants/contacts';
import type {
  ApplicantContact,
  ApplicantContactIndexEntry,
  ApplicantProfile,
  GoogleFormEntry,
  IdentityResolution,
  SharedContact,
} from '@/types';

/**
 * Applicant profile processing (isomorphic, runs with the signed-in staff
 * session from the client).
 *
 * When a form arrives, the ingestion API only stores it and runs the AI
 * evaluation. The applicant ficha is built later, the first time staff opens
 * the form (or selects it for an adoption), so the ingress endpoint stays fast
 * and no server credentials are needed.
 *
 * Identity rules:
 * - `googleAccountEmail` is the only valid email: Google adds it automatically
 *   and the applicant cannot edit it. It is the identity anchor, always
 *   confirmed and indexed automatically.
 * - The email typed by the applicant (`applicantEmail`) is legacy and no longer
 *   requested; it is ignored by this pipeline.
 * - Phone numbers are ambiguous free text: they are stored on the profile as
 *   `pending` and are neither indexed nor used for coincidences until staff
 *   confirms them from the ficha.
 *
 * Every write is idempotent: the form is flagged with `identityProcessedAt`
 * inside the same transaction, so opening the form twice (or two staff members
 * opening it at once) cannot create duplicate profiles.
 */

const APPLICANT_PROFILES_COLLECTION = 'applicantProfiles';
const APPLICANT_CONTACT_INDEX_COLLECTION = 'applicantContactIndex';

/** Outcome of processing a form's applicant identity. */
export type EnsureApplicantProfileStatus =
  | 'created'
  | 'matched'
  | 'unresolved'
  | 'already_processed';

/** Result of `ensureApplicantProfile`. */
export interface EnsureApplicantProfileResult {
  status: EnsureApplicantProfileStatus;
  /** Linked/created profile id, absent when the outcome is unresolved. */
  applicantId?: string;
  resolution?: IdentityResolution;
  /**
   * Legacy field kept for compatibility. Emails are no longer compared beyond
   * the anchor, and phones require staff confirmation, so it is always empty.
   */
  sharedContacts: SharedContact[];
}

function toConfirmedContact(
  contact: ContactInput,
  nowIso: string,
  formId: string,
  confirmedBy: string
): ApplicantContact {
  return {
    type: contact.type,
    value: contact.rawValue,
    normalizedValue: contact.normalizedValue,
    labels: [contact.label],
    sourceFormIds: [formId],
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    confirmationStatus: 'confirmed',
    confirmedBy,
    confirmedAt: nowIso,
  };
}

function toPendingContact(
  contact: DeclaredContactInput,
  nowIso: string,
  formId: string
): ApplicantContact {
  return {
    type: contact.type,
    value: contact.rawValue,
    labels: [contact.label],
    sourceFormIds: [formId],
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    confirmationStatus: 'pending',
  };
}

function mergeContactSources(
  existing: ApplicantContact,
  incoming: ApplicantContact
): ApplicantContact {
  return {
    ...existing,
    labels: [...new Set([...(existing.labels ?? []), ...(incoming.labels ?? [])])],
    sourceFormIds: [
      ...new Set([...(existing.sourceFormIds ?? []), ...(incoming.sourceFormIds ?? [])]),
    ],
    lastSeenAt: incoming.lastSeenAt,
  };
}

function upsertConfirmedContact(
  existing: ApplicantContact[],
  incoming: ApplicantContact
): ApplicantContact[] {
  const matchIndex = existing.findIndex(
    (entry) =>
      getApplicantContactStatus(entry) === 'confirmed' &&
      entry.type === incoming.type &&
      entry.normalizedValue === incoming.normalizedValue
  );

  if (matchIndex === -1) {
    return [...existing, incoming];
  }

  const current = existing[matchIndex];
  const updated: ApplicantContact = {
    ...mergeContactSources(current, incoming),
    normalizedValue: incoming.normalizedValue,
    confirmationStatus: 'confirmed',
    confirmedBy: current.confirmedBy ?? incoming.confirmedBy,
    confirmedAt: current.confirmedAt ?? incoming.confirmedAt,
  };

  const result = [...existing];
  result[matchIndex] = updated;
  return result;
}

function upsertPendingContact(
  existing: ApplicantContact[],
  incoming: ApplicantContact
): ApplicantContact[] {
  // If the same phone was already confirmed (e.g. a manual contact), do not
  // add a duplicate pending row.
  const normalizedIncoming = normalizeContactValue(incoming.type, incoming.value);
  const alreadyConfirmed = existing.some(
    (entry) =>
      getApplicantContactStatus(entry) === 'confirmed' &&
      entry.type === incoming.type &&
      Boolean(normalizedIncoming) &&
      entry.normalizedValue === normalizedIncoming
  );
  if (alreadyConfirmed) return existing;

  const matchIndex = existing.findIndex(
    (entry) =>
      entry.type === incoming.type &&
      getApplicantContactStatus(entry) !== 'confirmed' &&
      entry.value.trim().toLowerCase() === incoming.value.trim().toLowerCase()
  );

  if (matchIndex === -1) {
    return [...existing, incoming];
  }

  const result = [...existing];
  result[matchIndex] = mergeContactSources(result[matchIndex], incoming);
  return result;
}

/**
 * Processes the applicant identity for a form, creating the ficha and indexing
 * the automatic Google email when needed. Safe to call on every form open: it
 * is a no-op when `identityProcessedAt` is already set.
 *
 * @param params.formId - The googleForms document ID to process
 * @param params.actor - Staff member that triggered the processing (audit)
 * @returns The processing outcome (created, matched, unresolved or no-op)
 *
 * @example
 * const result = await ensureApplicantProfile({ formId: form.id, actor: currentUser });
 */
export async function ensureApplicantProfile(params: {
  formId: string;
  actor: { id: string; name: string };
}): Promise<EnsureApplicantProfileResult> {
  const { formId, actor } = params;
  const nowIso = new Date().toISOString();

  const result = await runTransaction(db, async (transaction) => {
    const formRef = doc(db, 'googleForms', formId);
    const formSnapshot = await transaction.get(formRef);
    if (!formSnapshot.exists()) {
      throw new Error(`googleForms/${formId} not found`);
    }

    const formData = formSnapshot.data() as GoogleFormEntry;
    if (formData.identityProcessedAt) {
      return {
        status: 'already_processed' as const,
        applicantId: formData.applicantId,
        resolution: formData.identityResolution,
        sharedContacts: formData.identityResolution?.sharedContacts ?? [],
      };
    }

    const anchorEmail = normalizeEmail(formData.googleAccountEmail);
    const anchorRawEmail =
      typeof formData.googleAccountEmail === 'string'
        ? formData.googleAccountEmail.trim()
        : (anchorEmail ?? '');
    const displayName = typeof formData.fullName === 'string' ? formData.fullName.trim() : '';
    const phoneContacts = extractPendingPhoneContacts(
      formData as unknown as Record<string, unknown>
    );
    const formActivityTime = parseFormDate(formData.submittedAt || formData.createdAt);
    const formActivityIso =
      formActivityTime !== null ? new Date(formActivityTime).toISOString() : nowIso;

    const markFormProcessed = (applicantId: string | undefined, resolution: IdentityResolution) => {
      transaction.update(formRef, {
        ...(applicantId ? { applicantId } : {}),
        identityResolution: resolution,
        identityProcessedAt: nowIso,
      });
    };

    // Without the automatic Google email there is no reliable anchor (legacy
    // forms); the form is marked as processed so it is not retried forever and
    // staff can associate it manually later.
    if (!anchorEmail) {
      const resolution: IdentityResolution = {
        status: 'unresolved',
        matchedContactTypes: [],
        resolvedAt: nowIso,
        resolvedBy: actor.id,
      };
      markFormProcessed(undefined, resolution);
      return { status: 'unresolved' as const, resolution, sharedContacts: [] };
    }

    const anchorRef = doc(
      db,
      APPLICANT_CONTACT_INDEX_COLLECTION,
      contactIndexDocId({ type: 'email', normalizedValue: anchorEmail })
    );
    const anchorSnapshot = await transaction.get(anchorRef);
    const anchorIndex = anchorSnapshot.exists()
      ? (anchorSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>)
      : null;

    // A shared Google email cannot identify a single person; leave the form
    // unlinked so a human decides.
    if (anchorIndex && (anchorIndex.applicantIds?.length ?? 0) > 1) {
      const resolution: IdentityResolution = {
        status: 'unresolved',
        matchedContactTypes: ['email'],
        candidateApplicantIds: anchorIndex.applicantIds,
        resolvedAt: nowIso,
        resolvedBy: actor.id,
      };
      markFormProcessed(undefined, resolution);
      return { status: 'unresolved' as const, resolution, sharedContacts: [] };
    }

    // Resolve the profile: existing one from the anchor email, or a new one.
    let applicantId: string;
    let createdProfile = false;
    let profile: ApplicantProfile | null = null;
    let profileRef = null as ReturnType<typeof doc> | null;

    if (anchorIndex && (anchorIndex.applicantIds?.length ?? 0) === 1) {
      applicantId = anchorIndex.applicantIds[0];
      profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);
      const profileSnapshot = await transaction.get(profileRef);
      if (!profileSnapshot.exists()) {
        // Stale index pointing to a missing profile: fail closed.
        const resolution: IdentityResolution = {
          status: 'unresolved',
          matchedContactTypes: ['email'],
          candidateApplicantIds: [applicantId],
          resolvedAt: nowIso,
          resolvedBy: actor.id,
        };
        markFormProcessed(undefined, resolution);
        return { status: 'unresolved' as const, resolution, sharedContacts: [] };
      }
      profile = profileSnapshot.data() as ApplicantProfile;
    } else if (formData.applicantId) {
      // Defensive: a form linked by a previous pipeline keeps its profile
      // instead of creating a duplicate.
      const linkedRef = doc(db, APPLICANT_PROFILES_COLLECTION, formData.applicantId);
      const linkedSnapshot = await transaction.get(linkedRef);
      if (linkedSnapshot.exists()) {
        applicantId = formData.applicantId;
        profileRef = linkedRef;
        profile = linkedSnapshot.data() as ApplicantProfile;
      } else {
        applicantId = crypto.randomUUID();
        createdProfile = true;
        profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);
      }
    } else {
      applicantId = crypto.randomUUID();
      createdProfile = true;
      profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);
    }

    const anchorContact = toConfirmedContact(
      {
        type: 'email',
        rawValue: anchorRawEmail || anchorEmail,
        normalizedValue: anchorEmail,
        label: 'googleAccountEmail',
      },
      nowIso,
      formId,
      'system'
    );
    const pendingPhoneContacts = phoneContacts.map((contact) =>
      toPendingContact(contact, nowIso, formId)
    );

    if (createdProfile && profileRef) {
      const contacts = pendingPhoneContacts.reduce(
        (accumulator, contact) => upsertPendingContact(accumulator, contact),
        [anchorContact]
      );

      transaction.set(profileRef, {
        canonicalName: displayName || 'Postulante sin nombre',
        searchName: normalizeApplicantSearchName(displayName),
        nameAliases: displayName ? [displayName] : [],
        contacts,
        blacklist: {
          active: false,
          reason: null,
          activatedAt: null,
          activatedBy: null,
        },
        formsCount: 1,
        adoptionCount: 0,
        returnCount: 0,
        identityStatus: 'active',
        firstSeenAt: formActivityIso,
        lastSeenAt: formActivityIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      } satisfies Omit<ApplicantProfile, 'id'>);
    } else if (profile && profileRef) {
      const currentAliases = profile.nameAliases ?? [];
      const knownAliases = new Set(currentAliases);
      const updatedAliases =
        displayName && !knownAliases.has(displayName)
          ? [...currentAliases, displayName]
          : currentAliases;

      const contacts = pendingPhoneContacts.reduce(
        (accumulator, contact) => upsertPendingContact(accumulator, contact),
        upsertConfirmedContact(profile.contacts ?? [], anchorContact)
      );

      const currentFirstTime = profile.firstSeenAt ? new Date(profile.firstSeenAt).getTime() : null;
      const currentLastTime = profile.lastSeenAt ? new Date(profile.lastSeenAt).getTime() : null;
      const validCurrentFirstTime =
        currentFirstTime !== null && !Number.isNaN(currentFirstTime) ? currentFirstTime : null;
      const validCurrentLastTime =
        currentLastTime !== null && !Number.isNaN(currentLastTime) ? currentLastTime : null;
      const nextFirstTime =
        validCurrentFirstTime !== null && formActivityTime !== null
          ? Math.min(validCurrentFirstTime, formActivityTime)
          : (validCurrentFirstTime ?? formActivityTime);
      const nextLastTime =
        validCurrentLastTime !== null && formActivityTime !== null
          ? Math.max(validCurrentLastTime, formActivityTime)
          : (validCurrentLastTime ?? formActivityTime);
      const nextFirstIso = nextFirstTime !== null ? new Date(nextFirstTime).toISOString() : null;
      const nextLastIso = nextLastTime !== null ? new Date(nextLastTime).toISOString() : null;

      transaction.update(profileRef, {
        nameAliases: updatedAliases,
        searchName: normalizeApplicantSearchName(displayName || profile.canonicalName || ''),
        contacts,
        formsCount: (profile.formsCount ?? 0) + 1,
        ...(nextFirstIso ? { firstSeenAt: nextFirstIso } : {}),
        ...(nextLastIso ? { lastSeenAt: nextLastIso } : {}),
        updatedAt: nowIso,
      });
    } else {
      throw new Error('Could not resolve an applicant profile reference');
    }

    // The automatic Google email is the only automatic index entry. Phones
    // stay unindexed until staff confirms them from the ficha.
    const currentIds = anchorIndex?.applicantIds ?? [];
    const nextIds = currentIds.includes(applicantId) ? currentIds : [...currentIds, applicantId];

    transaction.set(
      anchorRef,
      {
        type: 'email',
        applicantIds: nextIds,
        conflict: nextIds.length > 1,
        firstSeenAt: anchorIndex?.firstSeenAt ?? nowIso,
        lastSeenAt: nowIso,
      },
      { merge: true }
    );

    const resolution: IdentityResolution = {
      status: createdProfile ? 'created' : 'matched',
      matchedContactTypes: ['email'],
      resolvedAt: nowIso,
      resolvedBy: actor.id,
    };
    markFormProcessed(applicantId, resolution);

    return {
      status: createdProfile ? ('created' as const) : ('matched' as const),
      applicantId,
      resolution,
      sharedContacts: [],
    };
  });

  // Audit log after the transaction (best-effort): record which applicant was
  // created/linked and from which form, for staff-triggered processing.
  if (result.status === 'created' || result.status === 'matched') {
    try {
      await createAuditLog({
        type: 'applicant',
        action: result.status === 'created' ? 'create' : 'update',
        entityId: result.applicantId ?? formId,
        entityName: result.applicantId ?? formId,
        modifiedBy: actor.id,
        modifiedByName: actor.name,
        metadata: {
          formId,
          identityStatus: result.status,
          autoIndexedContacts: ['email'],
        },
      });
    } catch (error) {
      logger({
        level: 'error',
        code: 'APPLICANT_AUDIT_LOG_FAILED',
        message: `Could not write the audit log for form ${formId}`,
        data: error,
      });
    }
  }

  logger({
    level: 'info',
    code: 'APPLICANT_IDENTITY_PROCESSED',
    message: `Applicant identity processed for form ${formId}`,
    data: {
      status: result.status,
      applicantId: result.applicantId ?? null,
    },
  });

  return result;
}
