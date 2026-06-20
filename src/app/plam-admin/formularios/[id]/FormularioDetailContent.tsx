'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeftIcon } from '@/components/Icons';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { handlePromiseToast } from '@/lib/handleToast';
import type { Animal, GoogleFormEntry, GoogleFormStatus } from '@/types';
import FormChat from './FormChat';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Helpers (duplicated intentionally — isolated from the list page)
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<GoogleFormStatus, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_COLORS: Record<GoogleFormStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const SCORE_COLOR = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  high: 'Alta compatibilidad',
  medium: 'Compatibilidad media',
  low: 'Baja compatibilidad',
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  high: 'text-green-700 bg-green-50 border border-green-200',
  medium: 'text-amber-700 bg-amber-50 border border-amber-200',
  low: 'text-red-700 bg-red-50 border border-red-200',
};

const FIELD_LABELS: Record<string, string> = {
  submittedAt: 'Marca temporal',
  fullName: 'Nombre y apellido',
  contactSource:
    '¿Por donde se contactaron con nosotros (ej: facebook, instagram, etc)? ¿Cómo es su usuario en la red social?',
  selectedPet:
    'Nombre o descripción de la mascota elegida (pueden agregar el link de la foto donde lo vieron):',
  age: '¿Qué edad tiene usted?',
  address: 'Domicilio detallado y Localidad:',
  employmentStatus: '¿Cual es su profesión? ¿Trabaja actualmente?',
  workSchedule: '¿Horario de trabajo? ¿A qué dedica su tiempo libre?',
  vacationPlan:
    '¿Se toma vacaciones ? en caso de tomarse vacaciones ¿Ha pensado qué hará con su perro por vacaciones?',
  phone: 'Teléfonos de contacto:',
  housingType: 'Tipo de vivienda (apto, casa,...)',
  householdMembers:
    '¿Qué otras personas habitan en su casa? Tienes hijo/s? en caso de tener, que edad tiene/n ?',
  housingOwnership: '¿Vivienda propia o de alquiler?',
  neighborIssues:
    '¿Tiene algún vecino que esté especialmente en contra de que habiten perros en las viviendas cercanas?',
  lifespanKnowledge:
    '¿Cuántos años cree que puede vivir un perro (o gato si es lo que quiere adoptar)?',
  selectionCriteria:
    '¿Qué mira usted a la hora de elegir a un perro? (su físico, su carácter, su edad,...)',
  petNeeds: '¿Qué necesidades cree que tiene una mascota?',
  petDiet:
    '¿Qué alimentación cree que es la adecuada para un perro (o gato si es lo que quiere adoptar)?',
  neuteringOpinion: '¿Qué piensa de la castración? ¿Castraría usted a su mascota? ¿Por qué?',
  foodBrands:
    '¿Que marcas de comida suele darles a sus animales o cuales cree que son las apropiadas para ellos?',
  adoptionReason:
    '¿Por qué se decide a adoptar a un animal? ¿Con qué finalidad lo adopta? (Para compañía, para cría, para caza, como guardián, como terapia,...)',
  familyAgreement: '¿Comparten esta decisión si el resto de miembros del hogar?:',
  sleepLocation: '¿Dónde dormiría la mascota?',
  petExperience:
    '¿Ha tenido animales antes? En caso de que así sea, cuéntenos un poco sobre ellos y qué ocurrió con ellos:',
  otherPets: '¿Tiene actualmente otros animales en casa?',
  growthTolerance:
    '¿Qué ocurriría si el cachorro crece más de lo esperado? ¿Sería un gran problema para usted?:',
  hoursAlone: '¿Cuánto tiempo pasaría el animal solo en casa?:',
  offLeashPlan:
    '¿Tiene previsto dejarle suelto cuando lo saque de casa? Si es así, ¿cuándo y dónde será?',
  chainingOpinion:
    '¿Que piensa de un perro atado? Y si lo estuviera, ¿cuanto tiempo estaria atado el animal?',
  behaviorResponse:
    'Ante una inadaptación o problema de comportamiento en el animal que adopte, ¿qué haría usted para que no lo vuelva a hacer ?',
  identificationCommitment:
    'Se compromete a ponerle identificación con teléfono de contacto (collar anotado, chapita, llavero con escritura)?',
  annualVaccination: '¿Esta en condiciones a vacunar a su mascota todos los años?',
  yardSecurity:
    'En caso de tener patio, ¿está convenientemente vallado para evitar que los perros puedan “irse de paseo”?, ¿qué altura tiene la valla de su patio?:',
  alternativePetInterest:
    '¿En caso de no estar disponible la mascota (perro/gato) que le gusto para adoptar, le interesaria adoptar otra mascota(perro/gato)?',
  sizePreference: '¿Tiene alguna preferencia de tamaño de la mascota? si la tiene ¿Cual seria?',
} as const;

const resolvedStatus = (entry: GoogleFormEntry): GoogleFormStatus => entry.status ?? 'pending';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FormularioDetailContentProps {
  initialAnimals: Animal[];
}

/**
 * Full adoption form detail page.
 * Shows all raw answers in Q&A format, the AI evaluation panel, and status controls.
 *
 * @example
 * // Accessed via /plam-admin/formularios/[id]
 */
export default function FormularioDetailContent({ initialAnimals }: FormularioDetailContentProps) {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<GoogleFormEntry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [showApprovalOptions, setShowApprovalOptions] = useState(false);
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [animals] = useState<Animal[]>(initialAnimals);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchForm = async () => {
      try {
        const data = await getFirestoreDocById<GoogleFormEntry>({
          currentCollection: 'googleForms',
          id,
        });
        setForm(data ? { ...data, id } : null);
      } catch (error) {
        logger({ level: 'error', code: 'FETCH_FORM_ERROR', message: 'Error fetching form:', data: error });
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleStatusChange = async (
    newStatus: GoogleFormStatus,
    approvedAnimal?: { id: string; name: string }
  ) => {
    if (!form || !currentUser) return;

    const previous = resolvedStatus(form);
    if (previous === newStatus && !approvedAnimal && !form.approvedAnimalId) return;

    setUpdatingStatus(true);

    const updateData: Partial<GoogleFormEntry> = { status: newStatus };
    const changesAfter: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'approved') {
      if (approvedAnimal) {
        updateData.approvedAnimalId = approvedAnimal.id;
        updateData.approvedAnimalName = approvedAnimal.name;
        changesAfter.approvedAnimalId = approvedAnimal.id;
        changesAfter.approvedAnimalName = approvedAnimal.name;
      } else {
        updateData.approvedAnimalId = '';
        updateData.approvedAnimalName = '';
        changesAfter.approvedAnimalId = '';
        changesAfter.approvedAnimalName = '';
      }
    } else {
      updateData.approvedAnimalId = '';
      updateData.approvedAnimalName = '';
      changesAfter.approvedAnimalId = '';
      changesAfter.approvedAnimalName = '';
    }

    const promise = (async () => {
      await createAuditLog({
        type: 'form',
        action: 'update',
        entityId: form.id,
        entityName: form.fullName ?? form.id,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: {
          before: { status: previous, approvedAnimalId: form.approvedAnimalId, approvedAnimalName: form.approvedAnimalName },
          after: changesAfter,
        },
      });

      await postFirestoreData<Partial<GoogleFormEntry>>({
        data: updateData,
        currentCollection: 'googleForms',
        id: form.id,
      });

      setForm({ ...form, ...updateData });
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Actualizando estado...', text: '' },
        success: { title: 'Estado actualizado', text: `Nuevo estado: ${STATUS_LABELS[newStatus]}` },
        error: { title: 'Error', text: 'No se pudo actualizar el estado.' },
      },
    });

    setUpdatingStatus(false);
  };

  const filteredAnimals = animals.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprovedClick = () => {
    setShowApprovalOptions(true);
    setShowAnimalPicker(false);
    setSearchTerm('');
  };

  const handleSoloApproved = () => {
    setShowApprovalOptions(false);
    setShowAnimalPicker(false);
    handleStatusChange('approved');
  };

  const handleApprovedForAnimal = (animal: Animal) => {
    setShowApprovalOptions(false);
    setShowAnimalPicker(false);
    setSearchTerm('');
    handleStatusChange('approved', { id: animal.id, name: animal.name });
  };

  const handleRemoveAnimal = () => {
    handleStatusChange('approved');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!form) {
    return (
      <ProtectedRoute requiredRole="rescatista">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-gray-500">Formulario no encontrado.</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-green-forest hover:underline"
          >
            <ArrowLeftIcon size={16} title="Volver" /> Volver
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const evaluation = form.evaluation;
  const status = resolvedStatus(form);
  const rawAnswers = form.rawData ? Object.entries(form.rawData).filter(([, v]) => v?.trim()) : [];

  const labelKeys = Object.keys(FIELD_LABELS) as Array<keyof GoogleFormEntry>;

  return (
    <ProtectedRoute requiredRole="rescatista">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Back button + header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="mt-1 text-gray-400 hover:text-green-forest transition-colors shrink-0"
          >
            <ArrowLeftIcon size={22} title="Volver" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {form.fullName ?? '—'}
            </h1>
            {form.selectedPet && (
              <p className="text-sm text-gray-500 mt-0.5">Mascota: {form.selectedPet}</p>
            )}
            {form.createdAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(form.createdAt).toLocaleDateString('es-UY', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {/* AI Evaluation card */}
        {!evaluation ? (
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-400 italic">
              Evaluación de{' '}
              <span className="text-cream-light bg-caramel-deep rounded-2xl px-2 py-1">sof-IA</span>{' '}
              no disponible para este formulario.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 shadow rounded-xl  bg-gray-50  p-5 flex flex-col gap-4 ">
            <h2 className="font-semibold text-gray-800">
              Evaluación de{' '}
              <span className="text-cream-light bg-caramel-deep rounded-2xl px-2 py-1">sof-IA</span>
            </h2>

            {/* Score + recommendation */}
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className={`text-3xl font-black px-4 py-2 rounded-xl ${SCORE_COLOR(evaluation.score)}`}
              >
                {evaluation.score}
              </div>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${RECOMMENDATION_COLORS[evaluation.recommendation]}`}
              >
                {RECOMMENDATION_LABELS[evaluation.recommendation] ?? evaluation.recommendation}
              </span>
            </div>

            {/* Summary */}
            {evaluation.summary && (
              <p className="text-sm text-gray-600 leading-relaxed">{evaluation.summary}</p>
            )}

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Fortalezas</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5 shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {evaluation.concerns.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Riesgos</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.concerns.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing info */}
            {evaluation.missingInformation.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Información faltante</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.missingInformation.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-500">
                      <span className="mt-0.5 shrink-0">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preferences */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Preferencias del hogar</p>
              <div className="flex gap-2 flex-wrap">
                <PreferenceBadge label={`Especie: ${evaluation.preferences.species}`} />
                <PreferenceBadge label={`Tamaño: ${evaluation.preferences.size}`} />
                {evaluation.preferences.hasYard && <PreferenceBadge label="Tiene patio" />}
                {evaluation.preferences.hasKids && <PreferenceBadge label="Convive con niños" />}
                {evaluation.preferences.hasOtherDogs && (
                  <PreferenceBadge label="Convive con perros" />
                )}
                {evaluation.preferences.hasOtherCats && (
                  <PreferenceBadge label="Convive con gatos" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status selector */}
        <div className="border border-gray-200 shadow rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">Estado del formulario</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(STATUS_LABELS) as GoogleFormStatus[]).map((s) => {
              const isActive = status === s;
              const isApproved = s === 'approved';

              if (isApproved) {
                return (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={handleApprovedClick}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      isActive
                        ? `${STATUS_COLORS[s]} border-transparent`
                        : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              }

              return (
                <button
                  key={s}
                  disabled={updatingStatus}
                  onClick={() => {
                    setShowApprovalOptions(false);
                    setShowAnimalPicker(false);
                    handleStatusChange(s);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    isActive
                      ? `${STATUS_COLORS[s]} border-transparent`
                      : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>

          {/* Approval sub-options */}
          {showApprovalOptions && (
            <div className="border border-green-200 bg-green-50 rounded-xl p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-green-800">¿Cómo querés aprobarlo?</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSoloApproved}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-green-300 text-green-800 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Solo aprobado
                </button>
                <button
                  onClick={() => setShowAnimalPicker(true)}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-green-300 text-green-800 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Aprobado para...
                </button>
                <button
                  onClick={() => {
                    setShowApprovalOptions(false);
                    setShowAnimalPicker(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Animal picker */}
          {showAnimalPicker && (
            <div className="border border-green-200 bg-white rounded-xl p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-700">Seleccionar animal</p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar animal..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                {filteredAnimals.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    {searchTerm ? 'Sin resultados' : 'No hay animales disponibles'}
                  </p>
                ) : (
                  filteredAnimals.map((animal) => (
                    <button
                      key={animal.id}
                      onClick={() => handleApprovedForAnimal(animal)}
                      disabled={updatingStatus}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                      {animal.images?.[0]?.imgUrl ? (
                        <img
                          src={animal.images[0].imgUrl}
                          alt={animal.images[0].imgAlt || animal.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0">
                          {animal.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{animal.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {animal.species} · {animal.size} · {animal.status}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Assigned animal info */}
          {status === 'approved' && form.approvedAnimalName && !showApprovalOptions && (
            <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="font-medium">✓ Aprobado para:</span>
              <span className="font-semibold">{form.approvedAnimalName}</span>
              <button
                onClick={handleRemoveAnimal}
                disabled={updatingStatus}
                className="ml-auto text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Raw answers */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Respuestas completas</h2>
          {rawAnswers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin respuestas disponibles.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {labelKeys.map((key) => {
                if (typeof form[key] !== 'string') return null;

                const value = form[key];
                return (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {FIELD_LABELS[key] ?? key}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {value.trim() || 'Sin respuesta'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Internal discussion */}
        <FormChat formId={form.id} />
      </div>
    </ProtectedRoute>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Small badge for displaying evaluation preferences.
 */
function PreferenceBadge({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
      {label}
    </span>
  );
}
