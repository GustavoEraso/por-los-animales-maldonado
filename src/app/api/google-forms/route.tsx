import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sos un evaluador experto en formularios de adopción de animales para una organización de rescate.

Tu objetivo es realizar una preevaluación objetiva del postulante utilizando únicamente la información proporcionada en el formulario.

Debes identificar fortalezas, posibles riesgos, inconsistencias, señales positivas y aspectos que requieran una revisión humana más profunda.

Criterios a considerar:

* Tipo y estabilidad de vivienda.
* Presencia y seguridad de patio o espacios exteriores.
* Tiempo que la mascota permanecería sola.
* Experiencia previa con animales.
* Conocimiento sobre cuidados básicos, alimentación y salud.
* Actitud hacia la castración.
* Actitud hacia mantener animales atados o encerrados.
* Compromiso con vacunación, identificación y atención veterinaria.
* Composición familiar y entorno del hogar.
* Motivación para adoptar.
* Expectativas sobre el tamaño, comportamiento y necesidades del animal.
* Capacidad para afrontar problemas de adaptación o conducta.
* Coherencia general de las respuestas.

No penalices automáticamente la falta de experiencia previa con animales.

No inventes información que no aparezca en el formulario.

Si una respuesta es ambigua o insuficiente, señálala como un aspecto a revisar y no como un riesgo confirmado.

Responde exclusivamente con un JSON válido usando este formato:

{
"score": 0,
"strengths": [],
"concerns": [],
"missingInformation": [],
"summary": "",
"recommendation": "high|medium|low"
}

Reglas:

* score debe ser un número entre 0 y 100.
* strengths debe contener aspectos positivos concretos encontrados en el formulario.
* concerns debe contener posibles riesgos o puntos que merecen atención.
* missingInformation debe contener información importante que no pudo determinarse.
* summary debe ser un resumen breve de la evaluación en menos de 150 palabras.
* recommendation debe ser:

  * "high" para postulantes muy prometedores.
  * "medium" para postulantes adecuados con algunos puntos a revisar.
  * "low" para postulantes con múltiples riesgos o incompatibilidades.

Devuelve únicamente JSON válido. No utilices markdown, explicaciones ni texto adicional fuera del JSON.

Además del análisis, extrae las preferencias y características del hogar del postulante en el campo "preferences", usando exclusivamente los valores indicados:

{
"score": 0,
"strengths": [],
"concerns": [],
"missingInformation": [],
"summary": "",
"recommendation": "high|medium|low",
"preferences": {
  "species": "perro|gato|cualquiera",
  "size": "pequeño|mediano|grande|cualquiera",
  "hasKids": true,
  "hasOtherDogs": true,
  "hasOtherCats": true,
  "hasYard": true
}
}

Reglas para preferences:
* species: inferilo de las respuestas del formulario. Si no se puede determinar, usa "cualquiera".
* size: basate en la preferencia declarada. Si no tiene preferencia o acepta cualquiera, usa "cualquiera".
* hasKids: true si hay menores de edad conviviendo en el hogar.
* hasOtherDogs: true si actualmente conviven perros en el hogar.
* hasOtherCats: true si actualmente conviven gatos en el hogar.
* hasYard: true si menciona tener patio, jardín o espacio exterior.`;

interface GroqEvaluation {
  score: number;
  strengths: string[];
  concerns: string[];
  missingInformation: string[];
  summary: string;
  recommendation: 'high' | 'medium' | 'low';
  preferences: {
    species: 'perro' | 'gato' | 'cualquiera';
    size: 'pequeño' | 'mediano' | 'grande' | 'cualquiera';
    hasKids: boolean;
    hasOtherDogs: boolean;
    hasOtherCats: boolean;
    hasYard: boolean;
  };
}

// Fields excluded from Groq evaluation (personal/administrative data irrelevant to adoption quality)
const EVALUATION_EXCLUDED_FIELDS = new Set([
  'fullName',
  'phone',
  'address',
  'submittedAt',
  'contactSource',
  'selectedPet',
]);

function prepareEvaluationData(mappedData: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mappedData).filter(([key]) => !EVALUATION_EXCLUDED_FIELDS.has(key))
  );
}

async function evaluateWithGroq(
  mappedData: Record<string, unknown>
): Promise<GroqEvaluation | null> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(mappedData, null, 2) },
        ],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      const content = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return JSON.parse(content) as GroqEvaluation;
    } catch (err) {
      console.error(`Groq evaluation attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt === MAX_RETRIES) {
        console.warn('All Groq retries exhausted, saving without evaluation.');
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return null;
}

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

function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, ' ').trim();
}

function normalizeFormData(data: Record<string, string | string[]>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const cleanQuestion = normalizeQuestion(key);

    const normalizedKey = FIELD_MAP[cleanQuestion];

    if (!normalizedKey) continue;

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
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.GOOGLE_FORMS_API_SECRET) {
    console.warn('Unauthorized access attempt to Google Forms API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const mappedData = normalizeFormData(data as Record<string, string[]>);
  const cleanedData = cleanRawData(data as Record<string, string[]>);

  const evaluation = await evaluateWithGroq(prepareEvaluationData(mappedData));

  try {
    const docRef = await addDoc(collection(db, 'googleForms'), {
      ...mappedData,
      rawData: cleanedData,
      evaluation: evaluation ?? null,
      createdAt: new Date().toISOString(),
    });

    console.log('Form data saved with ID:', docRef.id);
    console.log('Mapped form data:', mappedData);
    console.log('Groq evaluation:', evaluation);

    return NextResponse.json({ id: docRef.id, evaluation });
  } catch (err) {
    console.error('Error saving form data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
