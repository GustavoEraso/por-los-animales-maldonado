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
export type AuditLogType = 'user' | 'banner' | 'contact' | 'animal' | 'config';

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
    | 'dashboardAnalytics';
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
