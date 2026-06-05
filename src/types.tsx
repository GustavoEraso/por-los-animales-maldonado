export interface Img {
  imgId: string;
  imgUrl: string;
  imgAlt: string;
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
}
interface Vaccination {
  date: number;
  vaccine: string;
}

export interface PrivateInfoType {
  id: string;
  name: string;
  caseManager?: string;
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
  changes?: {
    before?: beforeAfterType;
    after?: beforeAfterType;
  };
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
  | 'form';

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
    | 'googleFormComments';
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
  // Metadata
  submittedAt?: string;
  createdAt: string;
  rawData?: Record<string, string>;
  evaluation: GoogleFormEvaluation | null;
  status?: GoogleFormStatus;
}

/**
 * A single comment in the adoption form internal discussion thread.
 * Visible only to rescatistas, admins, and superadmins.
 */
export interface FormComment {
  id: string;
  formId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
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
