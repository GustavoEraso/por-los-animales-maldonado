/**
 * Versioned Google Forms input schemas.
 *
 * Each form version has its own question-label → canonical-field map so that
 * the two input contracts never mix. The legacy map lives in the legacy route;
 * this module owns the v2 map and the shared normalization helpers.
 *
 * The v2 keys below are the EXACT normalized Google Sheets headers provided by
 * the organization. `normalizeQuestion` collapses repeated whitespace and line
 * breaks, so map keys are written in their normalized (single-space) form.
 */

/**
 * Normalizes a Google Forms question label by collapsing whitespace.
 * Used to match incoming payload keys against the schema maps regardless of
 * line breaks or repeated spaces introduced by the Sheet.
 *
 * @param question - The raw question label from the payload
 * @returns The normalized single-space, trimmed label
 */
export function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, ' ').trim();
}

/**
 * Maps the new Google Form question labels to canonical Firestore field names.
 *
 * Kept independent from the legacy `FIELD_MAP` so that a wording change in one
 * form never affects the other.
 *
 * The combined food question maps entirely to `petDiet`; the
 * responsible-ownership question maps to `responsibleOwnershipAgreement`; the
 * informational adoption-responsibility note is intentionally NOT mapped (it
 * requires no response and is preserved only in `rawData`).
 */
export const FIELD_MAP_V2: Record<string, string> = {
  'Marca temporal': 'submittedAt',
  'Nombre y apellido': 'fullName',
  'Teléfonos de contacto:': 'phone',
  'Nombre o descripción de la mascota elegida (pueden agregar el link de la foto donde lo vieron):':
    'selectedPet',
  'Domicilio detallado (calle, número) y Localidad:': 'address',
  '¿Qué edad tiene usted?': 'age',
  '¿Trabaja actualmente? Cuál es su profesión? Horario de trabajo?': 'employmentStatus',
  '¿Ha pensado qué hará con su perro cuando se tome vacaciones?': 'vacationPlan',
  '¿Qué otras personas habitan en su casa? Tienes hijo/s? en caso de tener, que edad tiene/n ?':
    'householdMembers',
  'Tipo de vivienda (apto, casa,...):': 'housingType',
  'En caso de tener patio, ¿está convenientemente vallado para evitar que los perros puedan “irse de paseo”?, ¿qué altura tiene la valla de su patio?:':
    'yardSecurity',
  '¿Tiene algún vecino que esté especialmente en contra de que habiten perros en las viviendas cercanas?':
    'neighborIssues',
  '¿Vivienda propia o de alquiler?': 'housingOwnership',
  '¿Qué alimentación cree que es la adecuada para un perro (o gato si es lo que quiere adoptar)? ¿Que marcas de comida suele darles a sus animales?':
    'petDiet',
  '¿Qué piensa de la castración? ¿Castraría usted a su mascota? ¿Por qué?': 'neuteringOpinion',
  '¿Por qué se decide a adoptar a un animal? ¿Con qué finalidad lo adopta? (Para compañía, para cría, para caza, como guardián, como terapia,...)':
    'adoptionReason',
  '¿Comparten esta decisión el resto de miembros del hogar?:': 'familyAgreement',
  '¿Dónde dormiría la mascota?': 'sleepLocation',
  '¿Ha tenido animales antes? En caso de que así sea, cuéntenos un poco sobre ellos y qué ocurrió con ellos:':
    'petExperience',
  '¿Tiene actualmente otros animales en casa?': 'otherPets',
  '¿Cuánto tiempo pasaría el animal solo en casa?:': 'hoursAlone',
  '¿Tiene previsto dejarle suelto cuando lo saque de casa? Si es así, ¿cuándo y dónde será?':
    'offLeashPlan',
  '¿Que piensa de un perro atado?': 'chainingOpinion',
  'Ante una inadaptación o problema de comportamiento en el animal que adopte, ¿qué haría usted para que no lo vuelva a hacer ?':
    'behaviorResponse',
  'Se compromete a ponerle identificación con teléfono de contacto (collar anotado, chapita, llavero con escritura)?':
    'identificationCommitment',
  'Por la salud de su mascota y para evitar enfermedades es necesario vacunarlo anualmente. En caso de ser cachorro, se le debe completar el plan de vacunas y al siguiente año continuar con la anual (una vez al año). ¿Está en condiciones de hacerlo?':
    'annualVaccination',
  'La Ley N° 19.889 y el Decreto N° 57/023, Reglamentan que a partir de febrero de 2023, Es obligatoria la esterilización de todos los perros y gatos en el territorio nacional. Como grupo de rescate nos parece importante su implementación, por lo que se realizará un seguimiento y ayuda de coordinación de castración a los 6 meses.':
    'responsibleOwnershipAgreement',
  'Dirección de correo electrónico': 'googleAccountEmail',
};

/**
 * Canonical field names that correspond to personal/administrative data and
 * must NEVER be sent to the AI evaluation providers.
 */
export const EVALUATION_EXCLUDED_FIELDS_V2 = new Set([
  'fullName',
  'phone',
  'applicantEmail',
  'googleAccountEmail',
  'submittedAt',
  'contactSource',
  'selectedPet',
]);
