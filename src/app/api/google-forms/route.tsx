import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';

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
  '¿Esta en condiciones a a su mascota todos los años ?': 'annualCare',
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

function normalizeFormData(data: Record<string, string | string[]>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = FIELD_MAP[key];

    if (!normalizedKey) continue;

    result[normalizedKey] = Array.isArray(value) ? value[0] : value;
  }

  return result;
}
function cleanRawData(data: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value[0] ?? '']));
}

export async function GET() {
  return NextResponse.json({ message: 'Hello from Google Forms API route!' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.GOOGLE_FORMS_API_SECRET) {
    console.warn('Unauthorized access attempt to Google Forms API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const mappedData = normalizeFormData(data as Record<string, string[]>);
  const cleanedData = cleanRawData(data as Record<string, string[]>);

  try {
    const docRef = await addDoc(collection(db, 'googleForms'), {
      ...mappedData,
      rawData: cleanedData,
      createdAt: new Date().toISOString(),
    });

    console.log('Form data saved with ID:', docRef.id);
    console.log('Mapped form data:', mappedData);

    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    console.error('Error saving form data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
