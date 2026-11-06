import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { processApplicantSubmission } from '@/lib/applicants/submission';

// Maps Google Form question text to short Firestore field names.
// Key: exact question text from the form. Value: field name to use in Firestore.
const FIELD_MAP: Record<string, string> = {
  'Nombre y apellido': 'fullName',
  'Teléfonos de contacto:': 'phone',
  '¿Qué edad tiene usted?': 'age',
  'Domicilio detallado y Localidad:': 'address',
  'Tipo de vivienda (apto, casa,...)': 'housingType',
  '¿Vivienda propia o de alquiler?': 'housingOwnership',
  '¿Tiene actualmente otros animales en casa?': 'otherPets',
  '¿Comparten esta decisión si el resto de miembros del hogar?:': 'familyAgreement',
  '¿Cuánto tiempo pasaría el animal solo en casa?:': 'hoursAlone',
  '¿Dónde dormiría la mascota?': 'sleepLocation',
  '¿Qué necesidades cree que tiene una mascota?': 'petNeeds',
  '¿Qué alimentación cree que es la adecuada para un perro (o gato si es lo que quiere adoptar)?':
    'petDiet',
  '¿Que marcas de comida suele darles a sus animales o cuales cree que son las apropiadas para ellos?':
    'foodBrands',
  '¿Qué piensa de la castración? ¿Castraría usted a su mascota? ¿Por qué?': 'neuteringOpinion',
  '¿En caso de no estar disponible la mascota (perro/gato) que le gusto para adoptar, le interesaria adoptar otra mascota(perro/gato)?':
    'alternativePetInterest',
  '¿Que piensa de un perro atado? Y si lo estuviera, ¿cuanto tiempo estaria atado el animal?':
    'chainingOpinion',
  '¿Tiene previsto dejarle suelto cuando lo saque de casa? Si es así, ¿cuándo y dónde será?':
    'offLeashPlan',
  '¿Tiene alguna preferencia de tamaño de la mascota? si la tiene ¿Cual seria?': 'sizePreference',
  '¿Qué mira usted a la hora de elegir a un perro? (su físico, su carácter, su edad,...)':
    'selectionCriteria',
  '¿Por qué se decide a adoptar a un animal? ¿Con qué finalidad lo adopta? (Para compañía, para cría, para caza, como guardián, como terapia,...)':
    'adoptionReason',
  '¿Ha tenido animales antes? En caso de que así sea, cuéntenos un poco sobre ellos y qué ocurrió con ellos:':
    'petExperience',
  '¿Qué ocurriría si el cachorro crece más de lo esperado? ¿Sería un gran problema para usted?:':
    'growthTolerance',
  '¿Cuántos años cree que puede vivir un perro (o gato si es lo que quiere adoptar)?':
    'lifespanKnowledge',
  '¿Esta en condiciones a vacunar a su mascota todos los años?': 'annualVaccination',
  'En caso de tener patio, ¿está convenientemente vallado para evitar que los perros puedan “irse de paseo”?, ¿qué altura tiene la valla de su patio?:':
    'yardSecurity',
  '¿Qué otras personas habitan en su casa? Tienes hijo/s? en caso de tener, que edad tiene/n ?':
    'householdMembers',
  '¿Horario de trabajo? ¿A qué dedica su tiempo libre?': 'workSchedule',
  '¿Cual es su profesión? ¿Trabaja actualmente?': 'employmentStatus',
  '¿Se toma vacaciones ? en caso de tomarse vacaciones ¿Ha pensado qué hará con su perro por vacaciones?':
    'vacationPlan',
  '¿Tiene algún vecino que esté especialmente en contra de que habiten perros en las viviendas cercanas?':
    'neighborIssues',
  '¿Por donde se contactaron con nosotros (ej: facebook, instagram, etc)? ¿Cómo es su usuario en la red social?':
    'contactSource',
  'Nombre o descripción de la mascota elegida (pueden agregar el link de la foto donde lo vieron):':
    'selectedPet',
  'Ante una inadaptación o problema de comportamiento en el animal que adopte, ¿qué haría usted para que no lo vuelva a hacer ?':
    'behaviorResponse',
  'Se compromete a ponerle identificación con teléfono de contacto (collar anotado, chapita, llavero con escritura)?':
    'identificationCommitment',
  'Marca temporal': 'submittedAt',
};

function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, ' ').trim();
}

function normalizeFormData(data: Record<string, string | string[]>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const cleanQuestion = normalizeQuestion(key);
    const normalizedKey = FIELD_MAP[cleanQuestion];

    if (!normalizedKey) {
      continue;
    }

    result[normalizedKey] = Array.isArray(value) ? value[0] : value;
  }

  return result;
}

function cleanRawData(data: Record<string, string | string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      normalizeQuestion(key),
      Array.isArray(value) ? (value[0] ?? '') : value,
    ])
  );
}

export async function GET() {
  return NextResponse.json({ message: 'Hello from Google Forms API route!' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Fail closed: a missing server secret must never authorize a request.
  const expectedSecret = process.env.GOOGLE_FORMS_API_SECRET;
  if (!expectedSecret) {
    logger({
      level: 'error',
      code: 'MISSING_ENDPOINT_SECRET',
      message: 'GOOGLE_FORMS_API_SECRET is not configured; rejecting request',
    });
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  if (!token || token !== expectedSecret) {
    logger({ level: 'warn', code: 'UNAUTHORIZED', message: 'Invalid token' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const mappedData = normalizeFormData(data as Record<string, string[]>);
  const cleanedData = cleanRawData(data as Record<string, string[]>);

  let result: Awaited<ReturnType<typeof processApplicantSubmission>>;
  try {
    result = await processApplicantSubmission({
      canonicalData: mappedData,
      extraFields: {
        formVersion: 'legacy',
        rawData: cleanedData,
      },
    });
  } catch (err) {
    logger({
      level: 'error',
      code: 'FIRESTORE_SAVE_FAILED',
      errorType: 'Firestore',
      statusCode: 500,
      message: 'Failed to save form',
      data: err,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (result.evaluation) {
    return NextResponse.json({ id: result.formId, evaluation: result.evaluation }, { status: 201 });
  }

  // The evaluation timed out or failed — the UI offers a manual retry.
  return NextResponse.json({ id: result.formId, status: 'failed' }, { status: 201 });
}
