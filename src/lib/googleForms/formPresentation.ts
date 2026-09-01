/**
 * Version-aware form presentation definitions.
 *
 * These explicit ordered lists drive both the administrative interface and the
 * PDF rendering. They exist because Firebase map key order must never be
 * treated as the authoritative order of form questions.
 */

import type { GoogleFormEntry } from '@/types';

export type FormVersion = 'legacy' | 'v2';

export interface FormFieldPresentation {
  field: keyof GoogleFormEntry;
  label: string;
}

/**
 * Ordered presentation for the legacy (old) adoption form.
 * Preserves the original question order and wording.
 */
export const LEGACY_FORM_FIELDS: FormFieldPresentation[] = [
  { field: 'submittedAt', label: 'Marca temporal' },
  { field: 'fullName', label: 'Nombre y apellido' },
  {
    field: 'phone',
    label: 'Teléfonos de contacto:',
  },
  {
    field: 'selectedPet',
    label:
      'Nombre o descripción de la mascota elegida (pueden agregar el link de la foto donde lo vieron):',
  },
  { field: 'age', label: '¿Qué edad tiene usted?' },
  { field: 'address', label: 'Domicilio detallado y Localidad:' },
  {
    field: 'contactSource',
    label:
      '¿Por donde se contactaron con nosotros (ej: facebook, instagram, etc)? ¿Cómo es su usuario en la red social?',
  },
  {
    field: 'employmentStatus',
    label: '¿Cual es su profesión? ¿Trabaja actualmente?',
  },
  {
    field: 'workSchedule',
    label: '¿Horario de trabajo? ¿A qué dedica su tiempo libre?',
  },
  {
    field: 'vacationPlan',
    label:
      '¿Se toma vacaciones ? en caso de tomarse vacaciones ¿Ha pensado qué hará con su perro por vacaciones?',
  },
  { field: 'housingType', label: 'Tipo de vivienda (apto, casa,...)' },
  {
    field: 'housingOwnership',
    label: '¿Vivienda propia o de alquiler?',
  },
  {
    field: 'householdMembers',
    label:
      '¿Qué otras personas habitan en su casa? Tienes hijo/s? en caso de tener, que edad tiene/n ?',
  },
  {
    field: 'neighborIssues',
    label:
      '¿Tiene algún vecino que esté especialmente en contra de que habiten perros en las viviendas cercanas?',
  },
  {
    field: 'lifespanKnowledge',
    label: '¿Cuántos años cree que puede vivir un perro (o gato si es lo que quiere adoptar)?',
  },
  {
    field: 'selectionCriteria',
    label: '¿Qué mira usted a la hora de elegir a un perro? (su físico, su carácter, su edad,...)',
  },
  { field: 'petNeeds', label: '¿Qué necesidades cree que tiene una mascota?' },
  {
    field: 'petDiet',
    label:
      '¿Qué alimentación cree que es la adecuada para un perro (o gato si es lo que quiere adoptar)?',
  },
  {
    field: 'foodBrands',
    label:
      '¿Que marcas de comida suele darles a sus animales o cuales cree que son las apropiadas para ellos?',
  },
  {
    field: 'neuteringOpinion',
    label: '¿Qué piensa de la castración? ¿Castraría usted a su mascota? ¿Por qué?',
  },
  {
    field: 'alternativePetInterest',
    label:
      '¿En caso de no estar disponible la mascota (perro/gato) que le gusto para adoptar, le interesaria adoptar otra mascota(perro/gato)?',
  },
  {
    field: 'chainingOpinion',
    label:
      '¿Que piensa de un perro atado? Y si lo estuviera, ¿cuanto tiempo estaria atado el animal?',
  },
  {
    field: 'offLeashPlan',
    label:
      '¿Tiene previsto dejarle suelto cuando lo saque de casa? Si es así, ¿cuándo y dónde será?',
  },
  {
    field: 'sizePreference',
    label: '¿Tiene alguna preferencia de tamaño de la mascota? si la tiene ¿Cual seria?',
  },
  {
    field: 'adoptionReason',
    label:
      '¿Por qué se decide a adoptar a un animal? ¿Con qué finalidad lo adopta? (Para compañía, para cría, para caza, como guardián, como terapia,...)',
  },
  {
    field: 'petExperience',
    label:
      '¿Ha tenido animales antes? En caso de que así sea, cuéntenos un poco sobre ellos y qué ocurrió con ellos:',
  },
  {
    field: 'growthTolerance',
    label:
      '¿Qué ocurriría si el cachorro crece más de lo esperado? ¿Sería un gran problema para usted?:',
  },
  { field: 'otherPets', label: '¿Tiene actualmente otros animales en casa?' },
  {
    field: 'familyAgreement',
    label: '¿Comparten esta decisión si el resto de miembros del hogar?:',
  },
  { field: 'sleepLocation', label: '¿Dónde dormiría la mascota?' },
  { field: 'hoursAlone', label: '¿Cuánto tiempo pasaría el animal solo en casa?:' },
  {
    field: 'annualVaccination',
    label: '¿Esta en condiciones a vacunar a su mascota todos los años?',
  },
  {
    field: 'identificationCommitment',
    label:
      'Se compromete a ponerle identificación con teléfono de contacto (collar anotado, chapita, llavero con escritura)?',
  },
  {
    field: 'behaviorResponse',
    label:
      'Ante una inadaptación o problema de comportamiento en el animal que adopte, ¿qué haría usted para que no lo vuelva a hacer ?',
  },
  {
    field: 'yardSecurity',
    label:
      'En caso de tener patio, ¿está convenientemente vallado para evitar que los perros puedan “irse de paseo”?, ¿qué altura tiene la valla de su patio?:',
  },
];

/**
 * Ordered presentation for the new (v2) adoption form, using its own wording.
 */
export const NEW_FORM_FIELDS: FormFieldPresentation[] = [
  { field: 'submittedAt', label: 'Marca temporal' },
  { field: 'fullName', label: 'Nombre y apellido' },
  { field: 'phone', label: 'Teléfonos de contacto:' },
  {
    field: 'selectedPet',
    label:
      'Nombre o descripción de la mascota elegida (pueden agregar el link de la foto donde lo vieron):',
  },
  {
    field: 'address',
    label: 'Domicilio detallado (calle, número) y Localidad:',
  },
  { field: 'applicantEmail', label: 'Mail' },
  { field: 'age', label: '¿Qué edad tiene usted?' },
  { field: 'employmentStatus', label: '¿Trabaja actualmente?' },
  {
    field: 'vacationPlan',
    label: '¿Ha pensado qué hará con su perro cuando se tome vacaciones?',
  },
  {
    field: 'householdMembers',
    label:
      '¿Qué otras personas habitan en su casa? Tienes hijo/s? en caso de tener, que edad tiene/n ?',
  },
  { field: 'housingType', label: 'Tipo de vivienda (apto, casa,...):' },
  {
    field: 'yardSecurity',
    label:
      'En caso de tener patio, ¿está convenientemente vallado para evitar que los perros puedan “irse de paseo”?, ¿qué altura tiene la valla de su patio?:',
  },
  {
    field: 'neighborIssues',
    label:
      '¿Tiene algún vecino que esté especialmente en contra de que habiten perros en las viviendas cercanas?',
  },
  { field: 'housingOwnership', label: '¿Vivienda propia o de alquiler?' },
  {
    field: 'petDiet',
    label: '¿Qué alimentación y qué marcas de comida le daría a su mascota?',
  },
  {
    field: 'neuteringOpinion',
    label: '¿Qué piensa de la castración? ¿Castraría usted a su mascota? ¿Por qué?',
  },
  {
    field: 'adoptionReason',
    label:
      '¿Por qué se decide a adoptar a un animal? ¿Con qué finalidad lo adopta? (Para compañía, para cría, para caza, como guardián, como terapia,...)',
  },
  {
    field: 'familyAgreement',
    label: '¿Comparten esta decisión el resto de miembros del hogar?:',
  },
  { field: 'sleepLocation', label: '¿Dónde dormiría la mascota?' },
  {
    field: 'petExperience',
    label:
      '¿Ha tenido animales antes? En caso de que así sea, cuéntenos un poco sobre ellos y qué ocurrió con ellos:',
  },
  { field: 'otherPets', label: '¿Tiene actualmente otros animales en casa?' },
  { field: 'hoursAlone', label: '¿Cuánto tiempo pasaría el animal solo en casa?:' },
  {
    field: 'offLeashPlan',
    label:
      '¿Tiene previsto dejarle suelto cuando lo saque de casa? Si es así, ¿cuándo y dónde será?',
  },
  { field: 'chainingOpinion', label: '¿Que piensa de un perro atado?' },
  {
    field: 'behaviorResponse',
    label:
      'Ante una inadaptación o problema de comportamiento en el animal que adopte, ¿qué haría usted para que no lo vuelva a hacer ?',
  },
  {
    field: 'identificationCommitment',
    label:
      'Se compromete a ponerle identificación con teléfono de contacto (collar anotado, chapita, llavero con escritura)?',
  },
  {
    field: 'annualVaccination',
    label:
      'Por la salud de su mascota y para evitar enfermedades es necesario vacunarlo anualmente. En caso de ser cachorro, se le debe completar el plan de vacunas y al siguiente año continuar con la anual (una vez al año). ¿Está en condiciones de hacerlo?',
  },
  {
    field: 'responsibleOwnershipAgreement',
    label: 'Ley de tenencia responsable y esterilización (Ley 19.889 y Decreto 57/023)',
  },
  { field: 'googleAccountEmail', label: 'Dirección de correo electrónico' },
];

/**
 * Resolves the form version of a document, treating a missing or invalid value
 * as legacy for backward compatibility with pre-version records.
 *
 * @param entry - The GoogleFormEntry document
 * @returns The resolved form version ('legacy' or 'v2')
 */
export function resolveFormVersion(entry: GoogleFormEntry): FormVersion {
  return entry.formVersion === 'v2' ? 'v2' : 'legacy';
}

/**
 * Returns the ordered presentation definition for the given form version.
 *
 * @param version - The resolved form version
 * @returns The matching ordered field list
 */
export function getFormFieldDefinitions(version: FormVersion): FormFieldPresentation[] {
  return version === 'v2' ? NEW_FORM_FIELDS : LEGACY_FORM_FIELDS;
}
