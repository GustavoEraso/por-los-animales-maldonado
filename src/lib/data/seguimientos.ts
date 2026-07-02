import { PrivateInfoType } from '@/types';

/**
 * Sentinel defaults applied at read time for fields that may be missing
 * in older Firestore documents.
 */
const SENTINEL_SPECIES = 'perro' as const;
const SENTINEL_IMAGE = '';
const SENTINEL_STERILIZED = 'no' as const;
const SENTINEL_FOLLOWUP_STATUS = 'active' as const;
const SENTINEL_ZERO = 0;
const SENTINEL_EMPTY_STRING = '';

/** Consolidated follow-up record derived directly from PrivateInfoType denormalized fields. */
export interface AdoptedAnimalFollowup {
  animalId: string;
  animalName: string;
  animalSpecies: 'perro' | 'gato' | 'otros';
  animalImageUrl: string;
  isSterilized: 'si' | 'no' | 'no_se';
  caseManager: string;
  contactName: string;
  contacts: { type: 'celular' | 'email' | 'other'; value: string | number }[];
  address: string;
  notes: string[];
  vaccinations: { date: number; vaccine: string }[];
  /** 0 means no next follow-up scheduled. */
  nextFollowUpDate: number;
  /** 0 means no adoption recorded. */
  adoptionDate: number;
  lastFollowUpNote: string;
  /** 0 means no follow-up done yet. */
  lastFollowUpDate: number;
  /** 0 means not sterilized or unknown. */
  sterilizationDate: number;
  followUpStatus: 'active' | 'closed';
}

/**
 * Maps a PrivateInfoType document to an AdoptedAnimalFollowup,
 * applying sentinel defaults for any missing denormalized fields.
 */
export function mapToFollowup(pi: PrivateInfoType): AdoptedAnimalFollowup {
  return {
    animalId: pi.id,
    animalName: pi.name,
    animalSpecies: pi.species ?? SENTINEL_SPECIES,
    animalImageUrl: pi.mainImageUrl ?? SENTINEL_IMAGE,
    isSterilized: pi.isSterilized ?? SENTINEL_STERILIZED,
    caseManager: pi.caseManager ?? '',
    contactName: pi.contactName ?? '',
    contacts: pi.contacts ?? [],
    address: pi.address ?? '',
    notes: pi.notes ?? [],
    vaccinations: pi.vaccinations ?? [],
    nextFollowUpDate: pi.nextFollowUpDate ?? SENTINEL_ZERO,
    adoptionDate: pi.adoptionDate ?? SENTINEL_ZERO,
    lastFollowUpNote: pi.lastFollowUpNote ?? SENTINEL_EMPTY_STRING,
    lastFollowUpDate: pi.lastFollowUpDate ?? SENTINEL_ZERO,
    sterilizationDate: pi.sterilizationDate ?? SENTINEL_ZERO,
    followUpStatus: pi.followUpStatus ?? SENTINEL_FOLLOWUP_STATUS,
  };
}
