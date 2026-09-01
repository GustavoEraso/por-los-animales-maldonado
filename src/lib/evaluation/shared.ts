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

const googleModels = ['gemini-3.1-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'];
const GROQ_MODEL = 'openai/gpt-oss-120b';

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
  'applicantEmail',
  'googleAccountEmail',
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
 * @param mappedData - The prepared evaluation data
 * @param systemPrompt - The system prompt for the selected evaluation profile
 * @returns The evaluation result, or null if all models fail.
 */
async function evaluateWithGoogleAI(
  mappedData: Record<string, unknown>,
  systemPrompt: string
): Promise<FormEvaluation | null> {
  for (const model of googleModels) {
    try {
      const response = await googleAi.models.generateContent({
        model,
        config: {
          systemInstruction: systemPrompt,
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
 * Fallback evaluation using Groq with up to 3 retries.
 *
 * @param mappedData - The prepared evaluation data
 * @param systemPrompt - The system prompt for the selected evaluation profile
 * @returns The evaluation result, or null if all retries fail.
 */
async function evaluateWithGroq(
  mappedData: Record<string, unknown>,
  systemPrompt: string
): Promise<FormEvaluation | null> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
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
// Evaluation profiles
// ---------------------------------------------------------------------------

/**
 * Identifies which evaluation profile to use.
 * - `legacy`: original adoption form criteria (Google AI + Groq prompts).
 * - `v2`: new adoption form criteria (separate Google AI + Groq prompts).
 */
export type EvaluationProfile = 'legacy' | 'v2';

/**
 * Resolves the evaluation profile for a form document.
 * Missing or invalid version values fall back to `legacy`.
 *
 * @param formVersion - The stored form version, if present
 * @returns The evaluation profile to use
 */
export function resolveEvaluationProfile(formVersion?: string | null): EvaluationProfile {
  return formVersion === 'v2' ? 'v2' : 'legacy';
}

const SYSTEM_PROMPT_GOOGLE_V2 = `Sos un evaluador experto en formularios de adopción de animales para una organización de rescate.

Tu objetivo es realizar una preevaluación objetiva del postulante utilizando únicamente la información proporcionada en el formulario.

Este formulario es la versión NUEVA. Contiene menos preguntas que los formularios anteriores. NO señales como información faltante ninguna de las preguntas que este formulario no incluye. Solo considera "missingInformation" cuando una pregunta que SÍ está en este formulario esté sin responder o sea ambigua.

Las reglas y criterios definidos por los responsables de adopciones tienen prioridad sobre cualquier criterio general que puedas inferir.

No inventes información que no aparezca en el formulario.

No penalices automáticamente la falta de experiencia previa con animales.

No tengas en cuenta la preferencia de tamaño ("sizePreference"): este formulario no pregunta por ello. Para preferences.size, usa "cualquiera" salvo que puedas inferir de forma fiable un tamaño de las respuestas.

IMPORTANTE SOBRE ALIMENTACIÓN:
- El campo petDiet puede contener TANTO los hábitos de alimentación como las marcas de comida mencionadas. Analiza ambas cosas.
- Evalúa la calidad de las marcas mencionadas con la misma escala de marcas usada siempre.

MARCAS DE ALIMENTO (escala de calidad):
Marcas muy malas: Raza, Gati, Toky, Super Canito, Pelusa, Dogui, Connie, Whiskas.
Marcas malas: Astro, Sabrositos, Lager, Charrúa, Criolla, Trotter, Can Feed, Ecopet Natural, Nutrican, Friskies, Dog Chow, Cat Chow, Pedigree.
Marcas intermedias: Frost, Maxine, Purina, The Golden Choice, Primocão, Three Cats, Max Cat, Max, Vittamax.
Marcas buenas: Royal Canin, Hills, Equilibrio, Eukanuba, Matisse.
Marcas excelentes: Biofresh, Pro Plan, Acana, N&D, Fórmula Natural Fresh Meat.

CRITERIOS DE EVALUACIÓN

PERRO ATADO:
- Rechazo a mantener perros atados es muy positivo.
- Aceptable si menciona atarlos solo en situaciones excepcionales o puntuales.
- Negativo si plantea mantenerlos atados frecuentemente.

ALIMENTACIÓN:
- Positivo si menciona ración, balanceado, alimento para perros/gatos, comida natural, carnes o consulta veterinaria.
- Negativo si indica únicamente sobras, únicamente huesos o comida improvisada.

LUGAR DONDE DORMIRÁ:
- Cuanto más detallada, mejor. Dormir dentro es muy positivo; cucha protegida es positivo; afuera sin refugio es negativo.

IDENTIFICACIÓN:
- Afirmativa positiva; negativa negativa; ausencia negativa.

RELACIÓN CON VECINOS:
- Vecinos que rechazan animales es negativo. No sabe: a revisar. Vecinos con mascotas: positivo.

TRABAJO:
- Cuanto más detalle, mejor. No penalices horarios laborales por sí solos. Evalúa disponibilidad razonable. Este formulario NO pregunta profesión ni tiempo libre: no lo reports como faltante.

ELECCIÓN DEL ANIMAL / MOTIVACIÓN:
- Dar hogar a un animal necesitado es muy positivo. Motivaciones utilitarias se analizan con mayor atención.

CASTRACIÓN:
- Uno de los criterios más importantes. Negativa o resistencia muy negativa. Afirmativa positiva. Mencionar responsabilidad social, salud o experiencias previas es muy positiva.

DECISIÓN FAMILIAR:
- Si algún integrante del hogar no está de acuerdo, es muy negativo.

PASEOS Y LIBERTAD:
- Correa es muy positivo; suelto en propiedad es positivo; suelto habitualmente fuera es negativo.

PROBLEMAS DE CONDUCTA:
- Educar, tener paciencia o buscar ayuda profesional es positivo. Re-adoptar, atar o usar violencia es negativo.

EXPERIENCIA PREVIA:
- Cuanto más detalle, mejor. No penalices no haber tenido animales antes.

EDAD:
- Menor de 18 años es muy negativo. Mayor o igual a 18 es aceptable.

OTRAS MASCOTAS:
- Respuesta generalmente indiferente; cuanta más información, mejor.

VIVIENDA:
- Tipo es contextual. No penalices apartamentos o viviendas pequeñas.

PROPIEDAD O ALQUILER:
- Propia levemente positiva. Alquiler no negativa por sí sola.

PATIO Y SEGURIDAD:
- Patio cerrado/vallado positivo. Patio sin cerrar muy negativo. Sin patio: a considerar, no penalizar automáticamente.

EMPLEO:
- Tener empleo o ingresos es positivo. Falta de empleo puede ser a revisar, pero no determina por sí sola el resultado.

VACUNACIÓN:
- Afirmativa positiva; negativa negativa; condicionada a situación económica negativa; ausencia negativa.

VACACIONES:
- Llevar la mascota es positivo; dejarla con familiares responsables es positivo; no saber qué hará es negativo.

COMPOSICIÓN DEL HOGAR:
- Cuanto más detalle, mejor. Varios niños pequeños no es negativo pero se señala como aspecto a considerar.

TIEMPO SOLO:
- Hasta 8 horas es aceptable. Más de 8 horas se menciona como aspecto a revisar.

TENENCIA RESPONSABLE (importante para revisión humana):
- Evalúa la respuesta al campo responsableOwnershipAgreement.
- Si el postulante NO está de acuerdo, mencionalo en concerns de forma destacada, pero NO conviertas automáticamente la recomendación en "low" y NUNCA decidas el rechazo por ti solo; deja la decisión al evaluador humano.

UBICACIÓN:
- Si la dirección parece corresponder a un país distinto de Uruguay, muy negativo.
- Si menciona asentamientos, Barrio Benedetti, Eucaliptus, Eucaliptos o Barrio El Placer: agrega observación de que la dirección debe verificarse manualmente, reduce moderadamente el score, NO rechaces automáticamente.

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
- score entre 0 y 100.
- summary menor a 150 palabras.
- recommendation: high = muy prometedor, medium = adecuado con aspectos a revisar, low = múltiples riesgos importantes o incompatibilidades.
- preferences.size: usa "cualquiera" por defecto (este formulario no pregunta preferencia de tamaño).
- Devuelve únicamente JSON válido.`;

const SYSTEM_PROMPT_GROQ_V2 = `Sos un evaluador de formularios de adopción para una organización de rescate animal.

Este es el formulario NUEVO. NO reportes como información faltante las preguntas que este formulario no incluye (por ejemplo preferencia de tamaño, profesión, tiempo libre, marcas separadas de comida). Solo considera "missingInformation" cuando una pregunta que SÍ está en el formulario esté sin responder o sea ambigua.

Analiza únicamente la información proporcionada por el postulante. No inventes información.

Reglas importantes:
* Castración negativa o con fuerte resistencia es muy negativa.
* Rechazar perros atados es positivo; considerarlo normal habitualmente es negativo.
* Dormir dentro es muy positivo; afuera sin refugio claro es negativo.
* Compromiso con vacunación e identificación es positivo; negarse es negativo.
* Paseos con correa muy positivos; sueltos habitualmente fuera es negativo.
* Patio cerrado/vallado positivo; abierto o inseguro muy negativo.
* Dar hogar a un animal necesitado es motivación muy positiva.
* Educar, tener paciencia o buscar ayuda profesional ante conducta es positivo; violencia, atar permanentemente o abandonar es negativo.
* Menor de 18 años muy negativo.
* Hasta 8 horas solo es aceptable; más tiempo se menciona como aspecto a revisar.
* Si algún integrante del hogar no está de acuerdo, muy negativo.
* No penalices automáticamente falta de experiencia previa, vivir en apartamento o alquilar.
* En alimento, negativo si menciona únicamente sobras, huesos o comida improvisada.

Marcas negativas: Raza, Gati, Toky, Super Canito, Pelusa, Dogui, Connie, Whiskas, Astro, Sabrositos, Lager, Charrúa, Criolla, Trotter, Can Feed, Ecopet Natural, Nutrican, Friskies, Dog Chow, Cat Chow y Pedigree.

Dirección:
* Si parece de un país distinto a Uruguay, muy negativo.
* Si menciona asentamientos, Barrio Benedetti, Eucaliptus, Eucaliptos o Barrio El Placer, agrega observación de verificación manual y reduce moderadamente el score.

Tenencia responsable: si el postulante NO está de acuerdo, mencionalo en concerns de forma destacada pero no decidas el rechazo por ti mismo; deja la decisión al humano.

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
* size: usar "cualquiera" por defecto (este formulario no pregunta preferencia de tamaño).
* Devuelve únicamente JSON válido.`;

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Runs the full evaluation pipeline for a given profile:
 * 1. Google AI (3 models, first-success)
 * 2. Groq fallback (3 retries)
 * 3. Writes the result to Firestore googleForms/{docId} with merge
 *
 * @param docId - The Firestore document ID of the form to evaluate
 * @param evaluationData - Pre-processed form data (already filtered via prepareEvaluationData)
 * @param profile - The evaluation profile to use ('legacy' or 'v2'). Defaults to 'legacy' for backward compatibility.
 * @returns The evaluation result, or null if all providers + retries fail
 */
export async function runFullEvaluation(
  docId: string,
  evaluationData: Record<string, unknown>,
  profile: EvaluationProfile = 'legacy'
): Promise<FormEvaluation | null> {
  const systemPromptGoogle = profile === 'v2' ? SYSTEM_PROMPT_GOOGLE_V2 : SYSTEM_PROMPT_GOOGLE;
  const systemPromptGroq = profile === 'v2' ? SYSTEM_PROMPT_GROQ_V2 : SYSTEM_PROMPT_GROQ;

  let evaluation = await evaluateWithGoogleAI(evaluationData, systemPromptGoogle);

  if (!evaluation) {
    evaluation = await evaluateWithGroq(evaluationData, systemPromptGroq);
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
