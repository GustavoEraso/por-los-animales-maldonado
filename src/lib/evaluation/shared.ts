import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { logger } from '@/lib/logger';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

// ---------------------------------------------------------------------------
// AI client singletons
// ---------------------------------------------------------------------------

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const googleAi = new GoogleGenAI({
  apiKey: process.env['GEMINI_FORMS_API_KEY'],
});

const googleModels = ['gemini-3.1-flash-lite', 'gemma-4-31b', 'gemma-4-26b'];

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormEvaluation {
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

// ---------------------------------------------------------------------------
// Data preparation
// ---------------------------------------------------------------------------

/**
 * Fields excluded from the AI evaluation.
 * Personal/administrative data that is irrelevant to adoption quality.
 */
const EVALUATION_EXCLUDED_FIELDS = new Set([
  'fullName',
  'phone',
  'submittedAt',
  'contactSource',
  'selectedPet',
]);

/**
 * Strips personal/administrative fields from form data before sending to AI.
 * The AI should only see adoption-relevant fields, not PII.
 */
export function prepareEvaluationData(
  mappedData: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mappedData).filter(([key]) => !EVALUATION_EXCLUDED_FIELDS.has(key))
  );
}

// ---------------------------------------------------------------------------
// AI evaluation — Google AI
// ---------------------------------------------------------------------------

/**
 * Attempts evaluation using Google AI models sequentially.
 * Tries each model from the googleModels list; returns the first successful result.
 *
 * @returns The evaluation result, or null if all models fail.
 */
async function evaluateWithGoogleAI(
  mappedData: Record<string, unknown>
): Promise<FormEvaluation | null> {
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
      return JSON.parse(content) as FormEvaluation;
    } catch (err) {
      logger({
        level: 'error',
        code: 'GOOGLE_AI_FAILED',
        errorType: 'GoogleAI',
        message: model,
        data: err,
      });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// AI evaluation — Groq fallback
// ---------------------------------------------------------------------------

/**
 * Fallback evaluation using Groq (llama-3.3-70b-versatile) with up to 3 retries.
 *
 * @returns The evaluation result, or null if all retries fail.
 */
async function evaluateWithGroq(
  mappedData: Record<string, unknown>
): Promise<FormEvaluation | null> {
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

      return JSON.parse(content) as FormEvaluation;
    } catch (err) {
      logger({
        level: 'error',
        code: 'GROQ_FAILED',
        errorType: 'Groq',
        message: `attempt ${attempt}/${MAX_RETRIES}`,
        data: err,
      });
      if (attempt === MAX_RETRIES) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Runs the full evaluation pipeline:
 * 1. Google AI (3 models, first-success)
 * 2. Groq fallback (llama-3.3-70b, 3 retries)
 * 3. Writes the result to Firestore googleForms/{docId} with merge
 *
 * @param docId - The Firestore document ID of the form to evaluate
 * @param evaluationData - Pre-processed form data (already filtered via prepareEvaluationData)
 * @returns The evaluation result, or null if all providers + retries fail
 */
export async function runFullEvaluation(
  docId: string,
  evaluationData: Record<string, unknown>
): Promise<FormEvaluation | null> {
  let evaluation = await evaluateWithGoogleAI(evaluationData);

  if (!evaluation) {
    evaluation = await evaluateWithGroq(evaluationData);
  }

  if (evaluation) {
    try {
      await setDoc(doc(db, 'googleForms', docId), { evaluation }, { merge: true });
    } catch (err) {
      logger({
        level: 'error',
        code: 'FIRESTORE_MERGE_FAILED',
        errorType: 'Firestore',
        message: docId,
        data: err,
      });
    }
  }

  return evaluation;
}
