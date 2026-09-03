import type { Dispatch, SetStateAction } from 'react';

export interface Img {
  imgId: string;
  imgUrl: string;
  imgAlt: string;
}

/** Metadata for a PDF uploaded to Cloudinary. */
export interface PdfMetadata {
  publicId: string;
  secureUrl: string;
  fileName: string;
  format: string;
  bytes: number;
  resourceType: 'image' | 'raw';
}

type YesNoUnknown = 'si' | 'no' | 'no_se';

export interface CompatibilityType {
  dogs: YesNoUnknown;
  cats: YesNoUnknown;
  kids: YesNoUnknown;
}
export interface Animal {
  id: string;
  name: string;
  gender: 'macho' | 'hembra';
  species: 'perro' | 'gato' | 'otros';
  images: Img[];
  bannerImage?: string | null;
  description: string;
  aproxBirthDate: number;
  lifeStage: 'cachorro' | 'joven' | 'adulto';
  size: 'pequeño' | 'mediano' | 'grande' | 'no_se_sabe';
  compatibility: CompatibilityType;
  isSterilized: YesNoUnknown;
  isAvalible?: boolean; // Note: Typo is intentional to match existing code
  isAvailable?: boolean;
  isVisible: boolean;
  status: 'calle' | 'protectora' | 'transitorio' | 'adoptado' | 'hogar' | 'fallecido';
  waitingSince: number;
  isDeleted?: boolean;
  hardDeleted?: boolean;
  litterId?: string;
  litterName?: string;
  motherId?: string;
  fatherId?: string;
}

interface ContactType {
  type: 'celular' | 'email' | 'other';
  value: string | number;
  /** Identifies whose contact this is (e.g. "familiar", "pareja", "vecino"). */
  label?: string;
}
interface Vaccination {
  date: number;
  vaccine: string;
}

export interface PrivateInfoType {
  id: string;
  name: string;
  caseManager?: string[];
  rescueReason?:
    | 'abandonment'
    | 'lost'
    | 'sterilization'
    | 'illness'
    | 'abuse'
    | 'other'
    | 'hit_by_vehicle';
  vaccinations?: Vaccination[];
  medicalConditions?: string;
  notes?: string[];
  contactName?: string;
  address?: string;
  contacts?: ContactType[];
  totalCost?: number;
  adoptionFormId?: string;
  adoptionFormName?: string;
  /** Timestamp for the next scheduled follow-up. Used by the seguimiento dashboard to highlight pending cases. */
  nextFollowUpDate?: number;

  // ─── Seguimiento denormalized fields (sentinel-based, never undefined) ───
  /** Duplicated from Animal.species. Sentinel: 'perro'. */
  species?: 'perro' | 'gato' | 'otros';
  /** Duplicated from Animal.images[0].imgUrl. Sentinel: ''. */
  mainImageUrl?: string;
  /** Duplicated from Animal.isSterilized. Sentinel: 'no'. */
  isSterilized?: YesNoUnknown;
  /** Whether this animal is currently adopted. Sentinel: false. */
  isAdopted?: boolean;
  /** Follow-up tracking status. Sentinel: 'active'. */
  followUpStatus?: 'active' | 'closed';
  /** Person responsible for follow-up tracking (sentinel: ''). Distinct from caseManager (rescuer). */
  followUpManager?: string[];
  /** Name given by the adopter, distinct from the original organization name. Sentinel: ''. */
  newName?: string;
  /** Timestamp of the adoption event. Sentinel: 0. */
  adoptionDate?: number;
  /** Timestamp of the last follow-up event. Sentinel: 0. */
  lastFollowUpDate?: number;
  /** Note from the last follow-up event. Sentinel: ''. */
  lastFollowUpNote?: string;
  /** Timestamp of the sterilization event. Sentinel: 0. */
  sterilizationDate?: number;
  /** Images uploaded during follow-up events (sterilizations, vaccinations, etc.). */
  eventImages?: Img[];
  /** Applicant profile (ficha) of the current adopter, when adoption came from a linked form. */
  currentAdopterApplicantId?: string;
}

export type beforeAfterType = Partial<Animal> & Partial<PrivateInfoType>;

export interface AnimalTransactionType extends Partial<Animal>, PrivateInfoType {
  transactionId?: string;
  transactionType?:
    | 'create'
    | 'update'
    | 'delete'
    | 'transit_change'
    | 'adoption'
    | 'return'
    | 'medical'
    | 'vaccination'
    | 'sterilization'
    | 'emergency'
    | 'supply'
    | 'followup'
    | 'transfer'
    | 'rename'
    | 'deceased'
    | 'note'
    | 'other';
  id: string;
  name: string;
  transactionNote?: string;
  date: number;
  modifiedBy: string;
  since: number;
  cost?: number;
  img?: Img;
  /** Image(s) uploaded specifically for this event. Supports legacy single image for backward compatibility. */
  eventImg?: Img | Img[];
  /** PDF documents uploaded specifically for this event. */
  eventPdfs?: PdfMetadata[];
  /** Applicant profile involved in adoption/return events, when known. */
  applicantId?: string;
  changes?: {
    before?: beforeAfterType;
    after?: beforeAfterType;
  };
  /** Marks transactions registered for animals without a profile (external cases). */
  isExternal?: boolean;
}

/**
 * User role types defining access levels in the system.
 * - superadmin: Full system access, can manage all admins and users
 * - admin: Can manage rescatistas and all content
 * - rescatista: Can manage animals and adoptions
 * - user: Basic read-only access
 */
export type UserRole = 'superadmin' | 'admin' | 'rescatista' | 'user';

/**
 * User interface representing authenticated users in the system.
 */
export interface UserType {
  id: string;
  name: string;
  role: UserRole;
}

/**
 * Types of entities that can be audited in the system
 */
export type AuditLogType =
  | 'user'
  | 'banner'
  | 'contact'
  | 'animal'
  | 'config'
  | 'sponsor'
  | 'carousel'
  | 'form'
  | 'applicant';

/**
 * Actions that can be performed on entities
 */
export type AuditAction = 'create' | 'update' | 'delete';

/**
 * System audit log entry
 * Used to track all changes made to entities in the system
 */
export interface SystemAuditLog {
  id: string;
  type: AuditLogType;
  action: AuditAction;
  entityId: string;
  entityName?: string;
  modifiedBy: string;
  modifiedByName?: string;
  date: number;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export interface WpContactType {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
}

/**
 * Lean representation of a transaction stored in the public dashboard analytics document.
 * Contains only non-sensitive fields (no contact info, addresses, medical details).
 * Used for dashboard charts, stat cards, and "Últimos eventos" preview cards.
 * Click "Ver Detalles" loads the full AnimalTransactionType from animalTransactions (with auth).
 */
export interface LeanTransaction {
  transactionId: string;
  id: string;
  name: string;
  date: number;
  modifiedBy: string;
  transactionType?: AnimalTransactionType['transactionType'];
  status?: string;
  img?: Img;
  cost?: number;
  /** Marks transactions registered for animals without a profile (external cases). */
  isExternal?: boolean;
}

/**
 * Monthly aggregated data for dashboard charts.
 * Pre-computed on each transaction write to avoid costly read-time queries.
 */
export interface MonthlyAggregate {
  transactionCount: number;
  adoptionCount: number;
  adoptedAnimalIds: string[];
  animalIdsWithTx: string[];
  byUser: Record<string, number>;
}

/**
 * Dashboard analytics summary document stored in dashboardAnalytics/summary.
 * Public collection (allow read: if true) — contains only non-sensitive animal data.
 * Enables server-side caching via 'use cache' directive.
 */
export interface DashboardAnalyticsData {
  recentTransactions: LeanTransaction[];
  monthly: Record<string, MonthlyAggregate>;
  updatedAt: number;
}

/**
 * Daily aggregated transactions document stored in dailyTransactionAggregates/{dayKey}.
 * Keeps a full copy of each day's transactions so the timeline page can read one
 * document per day instead of one per transaction.
 */
export interface DailyTransactionAggregate {
  /** Day key in America/Montevideo timezone, format 'YYYY-MM-DD'. */
  dayKey: string;
  /** Full transaction copies keyed by transactionId (or doc id for legacy records). */
  transactions: Record<string, AnimalTransactionType>;
  updatedAt: number;
}

export interface CollectionsType {
  currentColection:
    | 'animals'
    | 'authorizedEmails'
    | 'contacts'
    | 'animalTransactions'
    | 'animalPrivateInfo'
    | 'banners'
    | 'sponsors'
    | 'carousels'
    | 'dashboardAnalytics'
    | 'config'
    | 'googleForms'
    | 'googleFormComments'
    | 'applicantProfiles'
    | 'applicantContactIndex'
    | 'seguimientoMatches';
}

// ---------------------------------------------------------------------------
// Google Forms adoption CRM
// ---------------------------------------------------------------------------

export type GoogleFormStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface GoogleFormPreferences {
  species: 'perro' | 'gato' | 'cualquiera';
  size: 'pequeño' | 'mediano' | 'grande' | 'cualquiera';
  hasKids: boolean;
  hasOtherDogs: boolean;
  hasOtherCats: boolean;
  hasYard: boolean;
}

export interface GoogleFormEvaluation {
  score: number;
  strengths: string[];
  concerns: string[];
  missingInformation: string[];
  summary: string;
  recommendation: 'high' | 'medium' | 'low';
  preferences: GoogleFormPreferences;
}

export interface GoogleFormEntry {
  id: string;
  // Personal info
  fullName?: string;
  phone?: string;
  address?: string;
  age?: string;
  // Housing
  housingType?: string;
  housingOwnership?: string;
  yardSecurity?: string;
  // Household
  householdMembers?: string;
  familyAgreement?: string;
  neighborIssues?: string;
  // Animal care
  otherPets?: string;
  hoursAlone?: string;
  sleepLocation?: string;
  petNeeds?: string;
  petDiet?: string;
  foodBrands?: string;
  neuteringOpinion?: string;
  chainingOpinion?: string;
  offLeashPlan?: string;
  annualVaccination?: string;
  identificationCommitment?: string;
  behaviorResponse?: string;
  // Preferences & motivation
  sizePreference?: string;
  selectionCriteria?: string;
  adoptionReason?: string;
  alternativePetInterest?: string;
  selectedPet?: string;
  contactSource?: string;
  // Experience
  petExperience?: string;
  growthTolerance?: string;
  lifespanKnowledge?: string;
  // Work & lifestyle
  workSchedule?: string;
  employmentStatus?: string;
  vacationPlan?: string;
  // Form version
  formVersion?: 'legacy' | 'v2';
  // Email fields (stored separately, excluded from AI evaluation)
  applicantEmail?: string;
  googleAccountEmail?: string;
  // Responsible-ownership-law response (v2)
  responsibleOwnershipAgreement?: string;
  // Metadata
  submittedAt?: string;
  createdAt: string;
  rawData?: Record<string, string>;
  evaluation: GoogleFormEvaluation | null;
  status?: GoogleFormStatus;
  // Approved animal reference (does NOT auto-execute adoption)
  approvedAnimalId?: string;
  approvedAnimalName?: string;
  // Applicant profile linkage (added by the identity resolution pipeline)
  applicantId?: string;
  identityResolution?: IdentityResolution;
  // Human decision details shown in the applicant history
  decisionReason?: string;
  decisionAt?: string;
  decisionBy?: string;
  // Lifecycle of the AI evaluation; distinguishes "not run yet" from "skipped"
  evaluationState?:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'skipped_blacklist'
    | 'skipped_error';
}

/**
 * Result of resolving which applicant profile a form belongs to.
 *
 * - `created`: a brand new profile was created for this submission.
 * - `matched`: exactly one existing profile was found via its contacts.
 * - `ambiguous`: different contacts pointed to different profiles; needs review.
 * - `unresolved`: no reliable contact was present to build identity on.
 * - `manually_linked`: an admin linked the form by hand.
 */
export type IdentityMatchStatus =
  | 'created'
  | 'matched'
  | 'ambiguous'
  | 'unresolved'
  | 'manually_linked';

export interface IdentityResolution {
  status: IdentityMatchStatus;
  matchedContactTypes: ('email' | 'phone')[];
  /** Profiles that were candidates when the outcome was ambiguous. */
  candidateApplicantIds?: string[];
  resolvedAt: string;
  resolvedBy: 'system' | string;
}

// ---------------------------------------------------------------------------
// Applicant profiles (fichas de postulantes)
// ---------------------------------------------------------------------------

/** Activation state and audit trail of the applicant blacklist. */
export interface ApplicantBlacklist {
  active: boolean;
  reason: string | null;
  activatedAt: string | null;
  activatedBy: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

/**
 * Canonical, stable record of a person applying to adopt ("ficha de postulante").
 * The document ID is a UUID generated server-side and never changes even when
 * the person's contacts change. Contacts are stored inline in the profile
 * and indexed in the reverse-lookup collection `applicantContactIndex`.
 */
export interface ApplicantProfile {
  id: string;
  canonicalName: string;
  nameAliases: string[];
  /** All known contacts, stored inline (small, bounded list per person). */
  contacts: ApplicantContact[];
  blacklist: ApplicantBlacklist;
  /** Number of linked googleForms (denormalized counter). */
  formsCount: number;
  /** Number of confirmed adoption transactions (denormalized counter). */
  adoptionCount: number;
  /** Number of return transactions (denormalized counter). */
  returnCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  /**
   * Identity lifecycle state of the profile.
   * - `active`: the profile is operational and usable.
   * - `needs_review`: there is insufficient info or an identity conflict.
   * - `merged`: the profile was merged into another (see `mergedInto`).
   */
  identityStatus: 'active' | 'needs_review' | 'merged';
  /**
   * When a profile is merged into another, this points to the surviving
   * profile. The merged profile is kept (never deleted) so history is
   * recoverable and links do not break.
   */
  mergedInto?: string;
  createdAt: string;
  updatedAt: string;
  /** General inline notes (no subcollections per project decision). */
  notes?: ApplicantNote[];
}

/** A free-form note left by staff on an applicant profile. */
export interface ApplicantNote {
  text: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

/** A contact stored inline in the applicant profile's `contacts` array. */
export interface ApplicantContact {
  type: 'email' | 'phone';
  /** Raw value as entered, for display purposes. */
  value: string;
  /** Normalized value used for matching. */
  normalizedValue: string;
  /** Source field(s) the value came from, e.g. ['applicantEmail']. */
  labels: string[];
  /** Forms where this contact was seen. */
  sourceFormIds: string[];
  firstSeenAt: string;
  lastSeenAt: string;
}

/**
 * Reverse index: normalized contact (HMAC-hashed as the document ID) ->
 * candidate profiles. Several profiles can share a contact (family phone,
 * recycled numbers); those cases are flagged with `conflict` and reviewed
 * by humans instead of auto-merged.
 */
export interface ApplicantContactIndexEntry {
  id: string;
  type: 'email' | 'phone';
  applicantIds: string[];
  conflict: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

/**
 * A chat message stored inside a googleFormComments/{formId} document.
 */
export interface ChatMessage {
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  formId: string;
}

export interface BannerType {
  id: string;
  showTitle?: boolean;
  title?: string;
  showDescription?: boolean;
  description?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  image: Img;
}

/**
 * Sponsor entity representing a partner organization displayed in the homepage carousel.
 */
export interface SponsorType {
  id: string;
  name: string;
  href?: string;
  image: Img;
}

/** A sponsor logo carousel with its own sponsor list, direction and speed. */
export interface CarouselType {
  id: string;
  name: string;
  direction: 'normal' | 'reverse';
  speed: number;
  sponsorIds: string[];
  active: boolean;
}

/**
 * Singleton config stored at config/carouselsConfig.
 * Each key is a place identifier, value is the ordered array of carousel IDs for that place.
 * Add new keys in Firestore to extend to new pages — no code changes needed.
 * e.g. { main: ['id1', 'id2'], adoptions: ['id3'] }
 */
export type CarouselsConfigType = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Event modal types (used by EventModal component)
// ---------------------------------------------------------------------------

/** Event types available for registration */
export type EventType =
  | 'medical'
  | 'vaccination'
  | 'sterilization'
  | 'emergency'
  | 'supply'
  | 'followup'
  | 'transfer'
  | 'rename'
  | 'deceased'
  | 'other';

/** Form data for event registration modal */
export interface EventFormData {
  eventType: EventType;
  note: string;
  cost: string;
  vaccineName?: string;
  vaccineDate?: string;
}

/** Shared props for action modals that modify animal/private info */
export interface AnimalActionModalProps {
  animal: Animal;
  privateInfo: PrivateInfoType;
  setAnimal: Dispatch<SetStateAction<Animal | null>>;
  setPrivateInfo: Dispatch<SetStateAction<PrivateInfoType | null>>;
  setAllAnimalTransactions: Dispatch<SetStateAction<AnimalTransactionType[]>>;
}
