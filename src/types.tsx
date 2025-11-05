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
  isAvalible: boolean;
  isVisible: boolean;
  status: 'calle' | 'protectora' | 'transitorio' | 'adoptado';
  waitingSince: number;
  isDeleted?: boolean;
  hardDeleted?: boolean;
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
  vaccinations?: Vaccination[];
  medicalConditions?: string;
  notes?: string;
  contactName?: string;
  contacts?: ContactType[];
}

export interface AnimalTransactionType extends Partial<Animal>, PrivateInfoType {
  id: string;
  name: string;
  notes?: string;
  date: number;
  modifiedBy: string;
  since: number;
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
  name: string;
  phone: string;
  countryCode: string;
}

export interface CollectionsType {
  currentColection:
    | 'animals'
    | 'authorizedEmails'
    | 'contacts'
    | 'animalTransactions'
    | 'animalPrivateInfo'
    | 'banners';
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
