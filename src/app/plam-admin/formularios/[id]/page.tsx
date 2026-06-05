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
import type { GoogleFormEntry, GoogleFormStatus } from '@/types';
import FormChat from './FormChat';

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

const resolvedStatus = (entry: GoogleFormEntry): GoogleFormStatus => entry.status ?? 'pending';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Full adoption form detail page.
 * Shows all raw answers in Q&A format, the AI evaluation panel, and status controls.
 *
 * @example
 * // Accessed via /plam-admin/formularios/[id]
 */
export default function FormularioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState<GoogleFormEntry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

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
        console.error('Error fetching form:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleStatusChange = async (newStatus: GoogleFormStatus) => {
    if (!form || !currentUser) return;

    const previous = resolvedStatus(form);
    if (previous === newStatus) return;

    setUpdatingStatus(true);

    const promise = (async () => {
      await createAuditLog({
        type: 'form',
        action: 'update',
        entityId: form.id,
        entityName: form.fullName ?? form.id,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: {
          before: { status: previous },
          after: { status: newStatus },
        },
      });

      await postFirestoreData<Partial<GoogleFormEntry>>({
        data: { status: newStatus },
        currentCollection: 'googleForms',
        id: form.id,
      });

      setForm({ ...form, status: newStatus });
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
          <div className="border border-gray-100 rounded-xl  bg-gray-50  p-5 flex flex-col gap-4 ">
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
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50  flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">Estado del formulario</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(STATUS_LABELS) as GoogleFormStatus[]).map((s) => (
              <button
                key={s}
                disabled={updatingStatus}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  status === s
                    ? `${STATUS_COLORS[s]} border-transparent`
                    : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Raw answers */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Respuestas completas</h2>
          {rawAnswers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Sin respuestas disponibles.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rawAnswers.map(([question, answer]) => (
                <div key={question} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {question}
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">{answer}</p>
                </div>
              ))}
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
