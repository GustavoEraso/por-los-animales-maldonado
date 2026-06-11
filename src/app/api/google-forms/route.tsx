import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const googleAi = new GoogleGenAI({
  apiKey: process.env['GEMINI_FORMS_API_KEY'],
});

const googleModels = ['gemini-3.1-flash-lite', 'gemma-4-31b', 'gemma-4-26b'];

const SYSTEM_PROMPT_GOOGLE = `Sos un evaluador experto en formularios de adopción de animales para una organización de rescate.

Tu objetivo es realizar una preevaluación objetiva del postulante utilizando únicamente la información proporcionada en el formulario.

Debes identificar fortalezas, posibles riesgos, inconsistencias, señales positivas y aspectos que requieran una revisión humana más profunda.

IMPORTANTE:

Las reglas y criterios descritos a continuación fueron definidos por los responsables de adopciones de la organización y tienen prioridad sobre cualquier criterio general que puedas inferir.

No inventes información que no aparezca en el formulario.

Si una respuesta es ambigua o insuficiente, señálala como un aspecto a revisar y no como un riesgo confirmado.

No penalices automáticamente la falta de experiencia previa con animales.

Evalúa el formulario completo considerando el contexto general del postulante y no únicamente respuestas individuales aisladas.

CRITERIOS DE EVALUACIÓN

ACTITUD HACIA PERROS ATADOS

- Es muy positivo si expresa rechazo a mantener perros atados.
- Es aceptable si menciona atarlos solamente en situaciones excepcionales o puntuales.
- Es negativo si plantea mantenerlos atados frecuentemente.
- Es muy negativo si considera normal tenerlos atados durante muchas horas o de forma habitual.

ALIMENTACIÓN

- Son positivas respuestas que mencionen:
  - ración
  - balanceado
  - alimento para perros o gatos
  - comida natural
  - carnes
  - consulta veterinaria

- Son negativas respuestas que indiquen:
  - únicamente sobras
  - únicamente huesos
  - comida improvisada según disponibilidad

LUGAR DONDE DORMIRÁ

- Mientras más detallada la respuesta, mejor.
- Dormir dentro de la vivienda es muy positivo.
- Dormir en cucha protegida es positivo.
- Dormir afuera con resguardo adecuado es positivo.
- Dormir afuera sin especificar protección o refugio es negativo.

IDENTIFICACIÓN

- Respuesta afirmativa es positiva.
- Respuesta negativa es negativa.
- Ausencia de respuesta es negativa.

REDES SOCIALES

- Respuesta indiferente.
- Si proporciona usuario de red social, considéralo levemente positivo.

DISPONIBILIDAD DE OTRA MASCOTA

- Respuesta indiferente.

RELACIÓN CON VECINOS

- Si menciona vecinos que rechazan animales es negativo.
- Si no sabe, es un punto a revisar.
- Si indica que los vecinos aceptan animales o tienen mascotas, es positivo.
- Si no tiene vecinos cercanos, es positivo.

TRABAJO Y TIEMPO LIBRE

- Mientras más detallado, mejor.
- No penalices automáticamente ningún horario laboral.
- Evalúa principalmente si existe disponibilidad razonable para la mascota.

ELECCIÓN DEL ANIMAL

- Respuesta generalmente indiferente.
- Si menciona ayudar a un animal necesitado o darle un hogar, considéralo muy positivo.

CASTRACIÓN

- Es uno de los criterios más importantes.
- Respuesta negativa es muy negativa.
- Dudas o resistencia son negativas.
- Respuesta afirmativa es positiva.
- Si menciona responsabilidad social, salud o experiencias previas con animales castrados, es muy positiva.

CALIDAD DE ALIMENTACIÓN ACTUAL

Marcas muy malas:
- Raza
- Gati
- Toky
- Super Canito
- Pelusa
- Dogui
- Connie
- Whiskas

Marcas malas:
- Astro
- Sabrositos
- Lager
- Charrúa
- Criolla
- Trotter
- Can Feed
- Ecopet Natural
- Nutrican
- Friskies
- Dog Chow
- Cat Chow
- Pedigree

Marcas intermedias:
- Frost
- Maxine
- Purina
- The Golden Choice
- Primocão
- Three Cats
- Max Cat
- Max
- Vittamax

Marcas buenas:
- Royal Canin
- Hills
- Equilibrio
- Eukanuba
- Matisse

Marcas excelentes:
- Biofresh
- Pro Plan
- Acana
- N&D
- Fórmula Natural Fresh Meat

NECESIDADES DE UNA MASCOTA

- Mientras más detallada la respuesta, mejor.
- Es especialmente positivo si menciona:
  - amor
  - abrigo
  - alimentación adecuada
  - paseos
  - atención veterinaria
  - compañía

DECISIÓN FAMILIAR

- Si algún integrante del hogar no está de acuerdo, es muy negativo.

PASEOS Y LIBERTAD

- Correa durante los paseos es muy positivo.
- Suelto únicamente dentro de la propiedad es positivo.
- Suelto en espacios abiertos con supervisión es positivo.
- Dejarlo habitualmente suelto fuera del hogar es negativo.

PROBLEMAS DE CONDUCTA

- Educarlo, tener paciencia o buscar ayuda profesional es positivo.
- Consultar a la organización es aceptable.
- Darlo en adopción nuevamente, atarlo o utilizar violencia es negativo.

EXPERIENCIA PREVIA

- Mientras más detallada la respuesta, mejor.
- No haber tenido animales anteriormente no debe penalizarse automáticamente.

EDAD

- Menor de 18 años es muy negativo.
- Mayor o igual a 18 años es aceptable.

OTRAS MASCOTAS

- Respuesta generalmente indiferente.
- Mientras más información aporte, mejor.

VIVIENDA

- Tipo de vivienda es un factor contextual.
- No penalices automáticamente apartamentos o viviendas pequeñas.

PROPIEDAD O ALQUILER

- Vivienda propia es levemente positiva.
- Vivienda de alquiler no debe considerarse negativa por sí sola.

CRECIMIENTO DEL ANIMAL

- Si expresa intención de devolver al animal por crecer más de lo esperado, es muy negativo.

PATIO Y SEGURIDAD

- Patio cerrado o vallado es positivo.
- Patio sin cerrar o inseguro es muy negativo.
- No tener patio es un aspecto a considerar, pero no debe penalizarse automáticamente.

EXPECTATIVA DE VIDA

- 10 años o más es positivo.
- Menos de 10 años es un aspecto a considerar.

EMPLEO

- Tener empleo o fuente de ingresos es positivo.
- Falta de empleo puede ser un aspecto a revisar, pero no debe determinar por sí sola el resultado final.

VACUNACIÓN

- Respuesta afirmativa es positiva.
- Respuesta negativa es negativa.
- Respuesta condicionada a la situación económica es negativa.
- Ausencia de respuesta es negativa.

MOTIVACIÓN PARA ADOPTAR

- Mientras más detallada la respuesta, mejor.
- Dar hogar a un animal necesitado es muy positivo.
- Motivaciones utilitarias deben analizarse con mayor atención.

VACACIONES

- Llevar la mascota consigo es positivo.
- Dejarla al cuidado de familiares o personas responsables es positivo.
- No saber qué hará o responder de forma ambigua es negativo.

COMPOSICIÓN DEL HOGAR

- Mientras más detallada la respuesta, mejor.
- La presencia de varios niños pequeños no es negativa, pero debe señalarse como aspecto a considerar.

TIEMPO SOLO

- Hasta 8 horas es aceptable.
- Más de 8 horas no es necesariamente negativo, pero debe mencionarse como aspecto a revisar.

UBICACIÓN

- Si la dirección parece corresponder a un país distinto de Uruguay, considéralo muy negativo.
- Analiza también referencias geográficas mencionadas en la dirección.

ZONAS A VERIFICAR

La organización puede tener restricciones operativas para determinadas zonas.

Si la dirección menciona explícitamente o parece referirse a:

- asentamientos
- Barrio Benedetti
- Eucaliptus
- Eucaliptos
- Barrio El Placer

o cualquier otra referencia que sugiera razonablemente un asentamiento o zona vulnerable:

- agrega una observación en concerns indicando que la dirección debe verificarse manualmente.
- reduce moderadamente el score.
- NO rechaces automáticamente la solicitud.
- NO conviertas por sí sola la recomendación en "low".

Si no tienes evidencia suficiente, no hagas suposiciones.

RESPUESTA

Devuelve exclusivamente un JSON válido usando este formato:

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

Reglas:

- score debe ser un número entre 0 y 100.
- strengths debe contener fortalezas concretas encontradas en el formulario.
- concerns debe contener riesgos o puntos que requieren revisión.
- missingInformation debe contener información importante que no pudo determinarse.
- summary debe tener menos de 150 palabras.
- recommendation:
  - high: postulante muy prometedor.
  - medium: postulante adecuado con aspectos a revisar.
  - low: múltiples riesgos importantes o incompatibilidades.

Reglas para preferences:

- species: inferir de las respuestas. Si no es posible determinarlo, usar "cualquiera".
- size: inferir de la preferencia declarada. Si no existe, usar "cualquiera".
- hasKids: true si viven menores de edad en el hogar.
- hasOtherDogs: true si conviven perros.
- hasOtherCats: true si conviven gatos.
- hasYard: true si menciona patio, jardín o espacio exterior.

Devuelve únicamente JSON válido.`;

const SYSTEM_PROMPT_GROQ = `Sos un evaluador de formularios de adopción para una organización de rescate animal.

Analiza únicamente la información proporcionada por el postulante.

No inventes información. Si una respuesta es ambigua o insuficiente, agrégala a "missingInformation" o "concerns" según corresponda.

Reglas importantes:

* La castración es uno de los factores más importantes. Respuestas negativas o con fuerte resistencia son muy negativas.
* Rechazar tener perros atados es positivo. Considerar normal tenerlos atados habitualmente es negativo.
* Dormir dentro de la vivienda es muy positivo. Dormir afuera sin refugio claro es negativo.
* Comprometerse con vacunación e identificación es positivo. Negarse es negativo.
* Paseos con correa son muy positivos. Dejar animales habitualmente sueltos fuera de la propiedad es negativo.
* Patio cerrado o vallado es positivo. Patio abierto o inseguro es muy negativo.
* Devolver un animal porque creció más de lo esperado es muy negativo.
* Dar hogar a un animal necesitado es una motivación muy positiva.
* Educar, tener paciencia o buscar ayuda profesional ante problemas de conducta es positivo.
* Utilizar violencia, atar permanentemente o abandonar al animal es negativo.
* Menor de 18 años es muy negativo.
* Hasta 8 horas solo es aceptable. Más tiempo debe mencionarse como aspecto a revisar.
* Si algún integrante del hogar no está de acuerdo con la adopción, es muy negativo.
* No penalices automáticamente la falta de experiencia previa con animales.
* No penalices automáticamente vivir en apartamento o alquilar.

Al evaluar alimentación considera negativo si menciona únicamente sobras, huesos o comida improvisada.

Considera negativas las siguientes marcas de alimento:

Raza, Gati, Toky, Super Canito, Pelusa, Dogui, Connie, Whiskas, Astro, Sabrositos, Lager, Charrúa, Criolla, Trotter, Can Feed, Ecopet Natural, Nutrican, Friskies, Dog Chow, Cat Chow y Pedigree.

Dirección:

* Si parece corresponder a un país distinto de Uruguay, considéralo muy negativo.
* Si menciona asentamientos, Barrio Benedetti, Eucaliptus, Eucaliptos o Barrio El Placer, agrega una observación indicando que la dirección debe verificarse manualmente y reduce moderadamente el score.

Devuelve exclusivamente JSON válido con esta estructura:

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

Reglas:

* score entre 0 y 100.
* summary menor a 150 palabras.
* species: inferir de las respuestas o usar "cualquiera".
* size: inferir de las respuestas o usar "cualquiera".
* hasKids: true si viven menores.
* hasOtherDogs: true si conviven perros.
* hasOtherCats: true si conviven gatos.
* hasYard: true si menciona patio, jardín o espacio exterior.

Devuelve únicamente JSON válido.
`;

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
  'submittedAt',
  'contactSource',
  'selectedPet',
]);

function prepareEvaluationData(mappedData: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mappedData).filter(([key]) => !EVALUATION_EXCLUDED_FIELDS.has(key))
  );
}

async function evaluateWithGoogleAI(
  mappedData: Record<string, unknown>
): Promise<GroqEvaluation | null> {
  for (const model of googleModels) {
    try {
      const response = await googleAi.models.generateContent({
        model,
        config: {
          systemInstruction: SYSTEM_PROMPT_GOOGLE,
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify(mappedData, null, 2) }],
          },
        ],
      });

      const raw = response.text ?? '';
      const content = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      console.log('Google AI tokens:', response.usageMetadata);
      console.log(`Google AI evaluation content from model "${model}":`, content);
      return JSON.parse(content) as GroqEvaluation;
    } catch (err) {
      console.error(`Google AI evaluation with model "${model}" failed:`, err);
    }
  }

  console.warn('All Google AI models failed.');
  return null;
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
          { role: 'system', content: SYSTEM_PROMPT_GROQ },
          { role: 'user', content: JSON.stringify(mappedData, null, 2) },
        ],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      const content = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      console.log('Groq evaluation content:', content);
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
      console.log('UNMAPPED:', JSON.stringify(cleanQuestion));
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
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.GOOGLE_FORMS_API_SECRET) {
    console.warn('Unauthorized access attempt to Google Forms API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const mappedData = normalizeFormData(data as Record<string, string[]>);
  const cleanedData = cleanRawData(data as Record<string, string[]>);

  const evaluationData = prepareEvaluationData(mappedData);
  let evaluation = await evaluateWithGoogleAI(evaluationData);

  if (!evaluation) {
    console.warn('Falling back to Groq evaluation...');
    evaluation = await evaluateWithGroq(evaluationData);
  }

  try {
    const docRef = await addDoc(collection(db, 'googleForms'), {
      ...mappedData,
      rawData: cleanedData,
      evaluation: evaluation ?? null,
      createdAt: new Date().toISOString(),
    });

    console.log('Form data saved with ID:', docRef.id);
    console.log('Mapped form data:', mappedData);
    console.log('IA evaluation:', evaluation);

    return NextResponse.json({ id: docRef.id, evaluation });
  } catch (err) {
    console.error('Error saving form data:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
