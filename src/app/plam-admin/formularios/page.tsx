'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap/dist/gsap';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { handlePromiseToast } from '@/lib/handleToast';
import type { GoogleFormEntry, GoogleFormStatus } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIN_LOADING_TIME = 600;

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

const sevenDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

type FilterTab = GoogleFormStatus | 'all';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CRM page for visualizing and managing adoption form submissions.
 * Desktop: split panel list + detail. Mobile: card grid navigating to /[id].
 */
export default function FormulariosPage() {
  const { currentUser } = useAuth();

  const cardsRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [forms, setForms] = useState<GoogleFormEntry[]>([]);
  const [selected, setSelected] = useState<GoogleFormEntry | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (loading || !cardsRef.current) return;
    const cards = cardsRef.current.children;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 50, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' }
    );
  }, [loading]);

  useEffect(() => {
    const start = Date.now();

    const fetchData = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'googleForms',
          orderBy: 'createdAt',
          direction: 'desc',
        });
        setForms(data as GoogleFormEntry[]);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [refresh]);

  // Keep selected panel in sync after refresh
  useEffect(() => {
    if (selected) {
      const updated = forms.find((f) => f.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [forms, selected]);

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------
  const totalForms = forms.length;
  const pendingCount = forms.filter((f) => resolvedStatus(f) === 'pending').length;
  const highScoreCount = forms.filter((f) => (f.evaluation?.score ?? 0) > 80).length;
  const recentCount = forms.filter((f) => f.createdAt >= sevenDaysAgo()).length;

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------
  const filteredForms =
    activeTab === 'all' ? forms : forms.filter((f) => resolvedStatus(f) === activeTab);

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------
  const handleStatusChange = async (newStatus: GoogleFormStatus) => {
    if (!selected || !currentUser) return;

    const previous = resolvedStatus(selected);
    if (previous === newStatus) return;

    setUpdatingStatus(true);

    const promise = (async () => {
      await createAuditLog({
        type: 'form',
        action: 'update',
        entityId: selected.id,
        entityName: selected.fullName ?? selected.id,
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
        id: selected.id,
      });

      setSelected({ ...selected, status: newStatus });
      setRefresh((r) => !r);
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

  return (
    <ProtectedRoute requiredRole="rescatista">
      <div className="flex flex-col gap-4 p-4 w-full min-h-screen bg-gradient-to-tr from-cream-light to-amber-sunset">
        {/* Header */}
        <h1 className="text-2xl font-bold text-green-dark">Formularios de adopción</h1>

        {/* Metrics */}
        <div ref={cardsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total formularios"
            subtitle="Formularios recibidos"
            value={totalForms}
            bgColor="bg-green-dark"
            textColor="text-white"
            subtitleColor="text-cream-light"
          />
          <MetricCard
            label="Pendientes"
            subtitle="Sin revisar"
            value={pendingCount}
            bgColor="bg-amber-sunset"
            textColor="text-green-dark"
            subtitleColor="text-green-dark"
          />
          <MetricCard
            label="Score > 80"
            subtitle="Alta compatibilidad"
            value={highScoreCount}
            bgColor="bg-green-forest"
            textColor="text-white"
            subtitleColor="text-cream-light"
          />
          <MetricCard
            label="Últimos 7 días"
            subtitle="Formularios recientes"
            value={recentCount}
            bgColor="bg-cream-light"
            textColor="text-green-dark"
            subtitleColor="text-green-dark"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-green-forest text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: split panel */}
        <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-4 flex-1">
          {/* List column */}
          <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-cream-light">
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {filteredForms.length === 0 && (
                <p className="p-4 text-sm text-gray-400 text-center">Sin resultados</p>
              )}
              {filteredForms.map((form) => {
                const score = form.evaluation?.score;
                const status = resolvedStatus(form);
                const isActive = selected?.id === form.id;

                return (
                  <button
                    key={form.id}
                    onClick={() => setSelected(form)}
                    className={`w-full text-left px-3 py-3 transition-colors ${
                      isActive
                        ? 'bg-amber-sunset/20 border-l-4 border-green-forest'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {form.fullName ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{form.selectedPet ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(form.createdAt).toLocaleDateString('es-UY', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {score !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SCORE_COLOR(score)}`}
                        >
                          Score {score}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="border border-gray-200 bg-cream-light rounded-xl p-5 overflow-y-auto">
            {!selected ? (
              <p className="text-gray-400 text-sm text-center mt-12">
                Seleccioná un formulario para ver el detalle
              </p>
            ) : (
              <DetailPanel
                form={selected}
                onStatusChange={handleStatusChange}
                updatingStatus={updatingStatus}
              />
            )}
          </div>
        </div>

        {/* Mobile: card grid */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {filteredForms.length === 0 && (
            <p className="col-span-2 text-center text-sm text-gray-400">Sin resultados</p>
          )}
          {filteredForms.map((form) => {
            const score = form.evaluation?.score;
            const status = resolvedStatus(form);

            return (
              <Link
                key={form.id}
                href={`/plam-admin/formularios/${form.id}`}
                className="border border-gray-200 bg-cream-light rounded-xl p-3 flex flex-col gap-1 hover:border-green-forest transition-colors active:bg-green-50"
              >
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                  {form.fullName ?? '—'}
                </p>
                <p className="text-xs text-gray-500 truncate">{form.selectedPet ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(form.createdAt).toLocaleDateString('es-UY', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {score !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold self-start ${SCORE_COLOR(score)}`}
                  >
                    Score {score}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium self-start ${STATUS_COLORS[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  subtitle: string;
  value: number;
  bgColor: string;
  textColor: string;
  subtitleColor: string;
}

/**
 * Single metric stat card for the CRM header.
 * Styled to match the main admin dashboard statistics cards.
 */
function MetricCard({
  label,
  subtitle,
  value,
  bgColor,
  textColor,
  subtitleColor,
}: MetricCardProps) {
  return (
    <div className={`${bgColor} rounded-3xl p-6 pb-2 shadow-lg`}>
      <h3 className={`text-lg ${textColor} mb-2`}>{label}</h3>
      <p className={`text-7xl ${textColor}`}>{value}</p>
      <p className={`text-sm ${subtitleColor} mt-1 mb-2`}>{subtitle}</p>
    </div>
  );
}

interface DetailPanelProps {
  form: GoogleFormEntry;
  onStatusChange: (status: GoogleFormStatus) => Promise<void>;
  updatingStatus: boolean;
}

/**
 * Detail panel shown on the right side of the desktop CRM split view.
 * Displays AI evaluation summary and status controls.
 */
function DetailPanel({ form, onStatusChange, updatingStatus }: DetailPanelProps) {
  const evaluation = form.evaluation;
  const status = resolvedStatus(form);

  return (
    <div className="flex flex-col gap-5">
      {/* Name + date */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">{form.fullName ?? '—'}</h2>
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

      {/* Evaluation */}
      {!evaluation ? (
        <p className="text-sm text-gray-400 italic">
          Evaluación de{' '}
          <span className="text-cream-light bg-caramel-deep rounded-2xl px-2 py-1">sof-IA</span> no
          disponible para este formulario.
        </p>
      ) : (
        <>
          {/* Score + recommendation */}
          <h2 className="font-semibold text-gray-800">
            Evaluación de{' '}
            <span className="text-cream-light bg-caramel-deep rounded-2xl px-2 py-1">sof-IA</span>
          </h2>
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
        </>
      )}

      {/* Status selector */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Estado</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(STATUS_LABELS) as GoogleFormStatus[]).map((s) => (
            <button
              key={s}
              disabled={updatingStatus}
              onClick={() => onStatusChange(s)}
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

      {/* Link to full answers */}
      <Link
        href={`/plam-admin/formularios/${form.id}`}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-forest text-white text-sm font-medium hover:bg-green-dark transition-colors self-start"
      >
        Ver respuestas completas
      </Link>
    </div>
  );
}
