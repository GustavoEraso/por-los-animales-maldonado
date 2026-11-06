/**
 * Applicant search (client-side).
 *
 * Prefix search by normalized name, phone or email. It queries Firestore
 * directly instead of loading every profile into memory:
 * - Name: range query on `applicantProfiles.searchName`.
 * - Phone/email: range query on `applicantContactIndex` document IDs.
 *
 * Results are capped to keep reads bounded. If there are more matches, the UI
 * asks the user to refine the search.
 */
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  normalizeApplicantSearchName,
  normalizePhoneSearchDigits,
} from '@/lib/applicants/contacts';
import { logger } from '@/lib/logger';
import type { ApplicantContactIndexEntry, ApplicantProfile } from '@/types';

const MAX_SEARCH_RESULTS = 20;
const MAX_INDEX_DOCS = 30;
const MIN_NAME_LENGTH = 2;
const MIN_PHONE_DIGITS = 3;

export type ApplicantSearchMode = 'name' | 'phone' | 'email' | 'none';

export interface ApplicantSearchResult {
  profiles: ApplicantProfile[];
  hasMore: boolean;
  mode: ApplicantSearchMode;
  term: string;
}

function sortByLastSeen(profiles: ApplicantProfile[]): ApplicantProfile[] {
  return [...profiles].sort((first, second) =>
    (second.lastSeenAt ?? '').localeCompare(first.lastSeenAt ?? '')
  );
}

/**
 * Searches applicant profiles across the whole collection by prefix.
 *
 * @param rawTerm - Text typed by staff (name, phone or email prefix)
 * @returns Up to 20 matching profiles plus a flag indicating more results
 */
export async function searchApplicantProfiles(rawTerm: string): Promise<ApplicantSearchResult> {
  const term = rawTerm.trim();

  if (term.length < MIN_NAME_LENGTH) {
    return { profiles: [], hasMore: false, mode: 'none', term };
  }

  const isEmail = term.includes('@');
  const digits = normalizePhoneSearchDigits(term);
  const isPhone = !isEmail && /\d/.test(term) && digits.length >= MIN_PHONE_DIGITS;

  try {
    if (isEmail) {
      return await searchByContactPrefix('email', term.toLowerCase(), term);
    }
    if (isPhone) {
      return await searchByContactPrefix('phone', digits, term);
    }

    const normalizedName = normalizeApplicantSearchName(term);
    if (normalizedName.length < MIN_NAME_LENGTH) {
      return { profiles: [], hasMore: false, mode: 'none', term };
    }
    return await searchByName(normalizedName, term);
  } catch (error) {
    logger({
      level: 'error',
      code: 'APPLICANT_SEARCH_ERROR',
      message: `Error searching applicants for "${term}"`,
      data: error,
    });
    throw error;
  }
}

async function searchByName(normalizedName: string, term: string): Promise<ApplicantSearchResult> {
  const snap = await getDocs(
    query(
      collection(db, 'applicantProfiles'),
      orderBy('searchName'),
      where('searchName', '>=', normalizedName),
      where('searchName', '<=', `${normalizedName}\uf8ff`),
      limit(MAX_SEARCH_RESULTS + 1)
    )
  );

  const hasMore = snap.docs.length > MAX_SEARCH_RESULTS;
  const profiles = snap.docs
    .slice(0, MAX_SEARCH_RESULTS)
    .map((profileDoc) => ({ ...(profileDoc.data() as ApplicantProfile), id: profileDoc.id }));

  return { profiles: sortByLastSeen(profiles), hasMore, mode: 'name', term };
}

async function searchByContactPrefix(
  type: 'phone' | 'email',
  prefix: string,
  term: string
): Promise<ApplicantSearchResult> {
  const indexSnap = await getDocs(
    query(
      collection(db, 'applicantContactIndex'),
      orderBy(documentId()),
      where(documentId(), '>=', `${type}:${prefix}`),
      where(documentId(), '<=', `${type}:${prefix}\uf8ff`),
      limit(MAX_INDEX_DOCS)
    )
  );

  const applicantIds = new Set<string>();
  for (const indexDoc of indexSnap.docs) {
    const data = indexDoc.data() as ApplicantContactIndexEntry;
    for (const applicantId of data.applicantIds ?? []) {
      applicantIds.add(applicantId);
    }
  }

  const limitedIds = [...applicantIds].slice(0, MAX_SEARCH_RESULTS);
  const profiles = await Promise.all(
    limitedIds.map(async (applicantId) => {
      const profileSnapshot = await getDoc(doc(db, 'applicantProfiles', applicantId));
      return profileSnapshot.exists()
        ? ({ ...(profileSnapshot.data() as ApplicantProfile), id: applicantId } as ApplicantProfile)
        : null;
    })
  );

  return {
    profiles: sortByLastSeen(
      profiles.filter((profile): profile is ApplicantProfile => profile !== null)
    ),
    hasMore: applicantIds.size > MAX_SEARCH_RESULTS || indexSnap.docs.length === MAX_INDEX_DOCS,
    mode: type,
    term,
  };
}
