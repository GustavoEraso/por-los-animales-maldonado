import { createHmac, randomUUID } from 'node:crypto';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import { ContactInput, extractContacts } from '@/lib/applicants/contacts';
import type {
  ApplicantContact,
  ApplicantContactIndexEntry,
  ApplicantProfile,
  IdentityResolution,
} from '@/types';

/**
 * Applicant identity resolution (server-only).
 *
 * Given the contacts found in a form submission, this module decides which
 * applicant profile (ficha) the submission belongs to and performs the
 * corresponding writes atomically inside a Firestore transaction:
 *
 * - Creates a new profile (UUID) when the contacts are new.
 * - Links to the existing profile when contacts resolve to exactly one.
 * - Returns an `ambiguous` outcome without linking when contacts within the
 *   same submission point to different profiles (reviewed by a human).
 *
 * Profiles store their contacts inline (`contacts` array). The reverse index
 * `applicantContactIndex` is keyed by an HMAC of the normalized contact value,
 * so no raw emails or phone numbers are used as document IDs.
 *
 * NOTE: this module uses Node's crypto and Firestore transactions; it must
 * only run on the server (API routes / server actions).
 */

export interface IdentityResolutionOutcome {
  /** Present when the outcome produced a profile link, undefined on ambiguity. */
  applicantId?: string;
  resolution: IdentityResolution;
  /** Whether the resolved profile is blacklisted (evaluation must be skipped). */
  blacklisted: boolean;
  /** Set when identity resolution could not run (e.g. missing secret). */
  skippedReason?: string;
}

const APPLICANT_PROFILES_COLLECTION = 'applicantProfiles';
const APPLICANT_CONTACT_INDEX_COLLECTION = 'applicantContactIndex';

function getIndexSecret(): string {
  return process.env.APPLICANT_INDEX_SECRET ?? '';
}

/**
 * Computes the deterministic (HMAC) document ID for a normalized contact.
 *
 * @param contact - Normalized contact information
 * @returns The opaque document ID for `applicantContactIndex`
 */
export function contactIndexId(contact: ContactInput): string {
  return createHmac('sha256', getIndexSecret())
    .update(`${contact.type}:${contact.normalizedValue}`)
    .digest('hex');
}

function toProfileContact(contact: ContactInput, nowIso: string, formId: string): ApplicantContact {
  return {
    type: contact.type,
    value: contact.rawValue,
    normalizedValue: contact.normalizedValue,
    labels: [contact.label],
    sourceFormIds: [formId],
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
  };
}

function mergeContactIntoList(
  existing: ApplicantContact[],
  contact: ContactInput,
  formId: string,
  nowIso: string
): ApplicantContact[] {
  const matchIndex = existing.findIndex(
    (entry) => entry.type === contact.type && entry.normalizedValue === contact.normalizedValue
  );

  if (matchIndex === -1) {
    return [...existing, toProfileContact(contact, nowIso, formId)];
  }

  const current = existing[matchIndex];
  const updated: ApplicantContact = {
    ...current,
    labels: current.labels.includes(contact.label)
      ? current.labels
      : [...current.labels, contact.label],
    sourceFormIds: current.sourceFormIds.includes(formId)
      ? current.sourceFormIds
      : [...current.sourceFormIds, formId],
    lastSeenAt: nowIso,
  };

  const result = [...existing];
  result[matchIndex] = updated;
  return result;
}

/**
 * Resolves or creates the applicant profile for a form submission.
 *
 * Runs inside a Firestore transaction so two concurrent submissions with the
 * same contact cannot create two separate profiles; the second transaction
 * retries and finds the profile already linked to the contact.
 *
 * @param params.contacts - Normalized contacts extracted from the form
 * @param params.displayName - Applicant's name, to fill the profile label
 * @param params.formId - The form document ID (recorded as contact source)
 * @param params.nowIso - Timestamp reused across all writes for consistency
 * @returns The resolution outcome (profile link, ambiguity, or skip reason)
 */
export async function resolveApplicantForSubmission(params: {
  contacts: ContactInput[];
  displayName: string;
  formId: string;
  nowIso: string;
}): Promise<IdentityResolutionOutcome> {
  const { contacts, displayName, formId, nowIso } = params;

  if (!getIndexSecret()) {
    // Fail closed: without the HMAC secret we cannot look up any contact index,
    // so we must assume the applicant could be blacklisted and block evaluation.
    return {
      resolution: {
        status: 'unresolved',
        matchedContactTypes: [],
        resolvedAt: nowIso,
        resolvedBy: 'system',
      },
      blacklisted: true,
      skippedReason: 'missing_index_secret',
    };
  }

  if (contacts.length === 0) {
    // Fail closed: without contacts we cannot identify the person, so we must
    // assume they could be blacklisted and block evaluation.
    return {
      resolution: {
        status: 'unresolved',
        matchedContactTypes: [],
        resolvedAt: nowIso,
        resolvedBy: 'system',
      },
      blacklisted: true,
      skippedReason: 'no_usable_contact',
    };
  }

  return runTransaction(db, async (transaction) => {
    // -------------------------------------------------------------------
    // Read every contact index doc first
    // -------------------------------------------------------------------
    const indexRefs = contacts.map((contact) =>
      doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, contactIndexId(contact))
    );
    const indexSnapshots = await Promise.all(indexRefs.map((ref) => transaction.get(ref)));

    // Collect every candidate applicant id found across all contacts
    const candidateIds = new Set<string>();
    const matchedContactTypes = new Set<'email' | 'phone'>();

    indexSnapshots.forEach((snapshot, position) => {
      if (!snapshot.exists()) return;
      const entry = snapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>;
      entry.applicantIds.forEach((id) => candidateIds.add(id));
      if (entry.applicantIds.length > 0) {
        matchedContactTypes.add(contacts[position].type);
      }
    });

    // -------------------------------------------------------------------
    // More than one candidate => ambiguous, link nothing, human review
    // -------------------------------------------------------------------
    if (candidateIds.size > 1) {
      const candidateList = [...candidateIds].sort();

      // Fail closed on ambiguity: if any candidate profile is blacklisted, the
      // submission must NOT be evaluated, because one of the possible matches
      // would otherwise bypass the blacklist.
      const candidateRefs = candidateList.map((id) => doc(db, APPLICANT_PROFILES_COLLECTION, id));
      const candidateSnapshots = await Promise.all(
        candidateRefs.map((ref) => transaction.get(ref))
      );
      const blacklisted =
        candidateSnapshots.some(
          (snapshot) => snapshot.exists() && (snapshot.data() as ApplicantProfile).blacklist?.active
        ) ?? false;

      logger({
        level: 'warn',
        code: 'IDENTITY_AMBIGUOUS',
        message: 'Form contacts point to multiple applicant profiles; left unlinked.',
        data: { candidateApplicantIds: candidateList, blacklisted },
      });
      return {
        resolution: {
          status: 'ambiguous',
          matchedContactTypes: [...matchedContactTypes],
          candidateApplicantIds: candidateList,
          resolvedAt: nowIso,
          resolvedBy: 'system',
        },
        blacklisted,
      };
    }

    // -------------------------------------------------------------------
    // Exactly one candidate => existing profile; attach new contacts if any
    // -------------------------------------------------------------------
    if (candidateIds.size === 1) {
      const applicantId = [...candidateIds][0];
      const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);
      const profileSnap = await transaction.get(profileRef);
      if (!profileSnap.exists()) {
        // Fail closed: the index points to a profile that no longer exists. We
        // cannot determine whether the missing profile was blacklisted, so we
        // block evaluation instead of allowing a potential bypass.
        throw new Error(`applicantProfiles/${applicantId} referenced but missing`);
      }
      const profile = profileSnap.data() as ApplicantProfile;
      const profileContacts = profile.contacts ?? [];

      // Register new contacts in the reverse index AND in the profile itself
      let nextContacts = profileContacts;
      for (const contact of contacts) {
        const indexSnapshot = indexSnapshots.find(
          (snapshot, position) =>
            contacts[position].normalizedValue === contact.normalizedValue &&
            contacts[position].type === contact.type
        );
        const indexLinksThisProfile =
          indexSnapshot?.exists() &&
          (indexSnapshot.data() as Omit<ApplicantContactIndexEntry, 'id'>).applicantIds.includes(
            applicantId
          );

        if (!indexLinksThisProfile) {
          transaction.set(
            doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, contactIndexId(contact)),
            {
              type: contact.type,
              applicantIds: [applicantId],
              conflict: false,
              firstSeenAt: nowIso,
              lastSeenAt: nowIso,
            },
            { merge: true }
          );
        }

        nextContacts = mergeContactIntoList(nextContacts, contact, formId, nowIso);
      }

      const currentNameAliases = profile.nameAliases ?? [];
      const knownAliases = new Set(currentNameAliases);
      const updatedAliases =
        displayName && !knownAliases.has(displayName)
          ? [...currentNameAliases, displayName]
          : currentNameAliases;

      transaction.update(profileRef, {
        nameAliases: updatedAliases,
        contacts: nextContacts,
        formsCount: (profile.formsCount ?? 0) + 1,
        lastSeenAt: nowIso,
        updatedAt: nowIso,
      });

      return {
        applicantId,
        resolution: {
          status: 'matched',
          matchedContactTypes: [...matchedContactTypes],
          resolvedAt: nowIso,
          resolvedBy: 'system',
        },
        blacklisted: profile.blacklist?.active ?? false,
      };
    }

    // -------------------------------------------------------------------
    // No candidates => create a fresh profile (UUID) and link everything
    // -------------------------------------------------------------------
    const applicantId = randomUUID();
    const profileRef = doc(db, APPLICANT_PROFILES_COLLECTION, applicantId);

    transaction.set(profileRef, {
      canonicalName: displayName || 'Postulante sin nombre',
      nameAliases: displayName ? [displayName] : [],
      contacts: contacts.map((contact) => toProfileContact(contact, nowIso, formId)),
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
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    } satisfies Omit<ApplicantProfile, 'id'>);

    for (const contact of contacts) {
      transaction.set(doc(db, APPLICANT_CONTACT_INDEX_COLLECTION, contactIndexId(contact)), {
        type: contact.type,
        applicantIds: [applicantId],
        conflict: false,
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
      } satisfies Omit<ApplicantContactIndexEntry, 'id'>);
    }

    return {
      applicantId,
      resolution: {
        status: 'created',
        matchedContactTypes: contacts.map((contact) => contact.type),
        resolvedAt: nowIso,
        resolvedBy: 'system',
      },
      blacklisted: false,
    };
  });
}

/**
 * Convenience wrapper used by the form ingestion routes: extracts the
 * contacts from the mapped (canonical) form fields and resolves the identity,
 * never throwing — failures degrade to an `unresolved` outcome and are logged,
 * so a broken identity layer never blocks form ingestion.
 *
 * @param params.mappedData - Canonical form fields (after FIELD_MAP mapping)
 * @param params.formId - Document ID the form will be saved with
 * @param params.nowIso - Timestamp shared with the form document
 */
export async function resolveIdentityForForm(params: {
  mappedData: Record<string, unknown>;
  formId: string;
  nowIso: string;
}): Promise<IdentityResolutionOutcome> {
  const { mappedData, formId, nowIso } = params;

  try {
    const contacts = extractContacts(mappedData);
    const displayName = typeof mappedData.fullName === 'string' ? mappedData.fullName.trim() : '';

    return await resolveApplicantForSubmission({ contacts, displayName, formId, nowIso });
  } catch (error) {
    // Fail closed: if resolution throws we cannot determine the applicant's
    // identity or blacklist status, so we must block evaluation to prevent a
    // possible blacklist bypass.
    logger({
      level: 'error',
      code: 'IDENTITY_RESOLUTION_FAILED',
      message: 'Identity resolution failed; form saved without applicant link',
      data: error,
    });
    return {
      resolution: {
        status: 'unresolved',
        matchedContactTypes: [],
        resolvedAt: nowIso,
        resolvedBy: 'system',
      },
      blacklisted: true,
      skippedReason: 'resolution_error',
    };
  }
}
