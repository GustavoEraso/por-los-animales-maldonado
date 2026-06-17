'use client';

import { useState, useRef, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  type QueryConstraint,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import Loader from '@/components/Loader';
import { EyeIcon, SearchIcon } from '@/components/Icons';
import { logger } from '@/lib/logger';

const ITEMS_PER_PAGE = 50;

const COLLECTIONS = [
  { value: 'systemAuditLog', label: 'Auditoría del Sistema' },
  { value: 'logs', label: 'Logs de la App' },
] as const;

// ── Audit types ──
const AUDIT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'user', label: 'Usuario' },
  { value: 'animal', label: 'Animal' },
  { value: 'banner', label: 'Banner' },
  { value: 'contact', label: 'Contacto' },
  { value: 'config', label: 'Configuración' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'carousel', label: 'Carrusel' },
  { value: 'form', label: 'Formulario' },
] as const;

const AUDIT_ACTIONS = [
  { value: '', label: 'Todas' },
  { value: 'create', label: 'Creación' },
  { value: 'update', label: 'Actualización' },
  { value: 'delete', label: 'Eliminación' },
] as const;

// ── Log levels ──
const LOG_LEVELS = [
  { value: '', label: 'Todos' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
] as const;

// ── Helpers ──

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionBadge(action: string): string {
  const map: Record<string, string> = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
  };
  return map[action] ?? 'bg-gray-100 text-gray-800';
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = { create: 'Creación', update: 'Actualización', delete: 'Eliminación' };
  return map[action] ?? action;
}

function getTypeLabel(type: string): string {
  const t = AUDIT_TYPES.find((t) => t.value === type);
  return t?.label ?? type;
}

function getLevelBadge(level: string): string {
  const map: Record<string, string> = {
    error: 'bg-red-100 text-red-800',
    warn: 'bg-orange-100 text-orange-800',
    info: 'bg-blue-100 text-blue-800',
    debug: 'bg-gray-100 text-gray-800',
  };
  return map[level] ?? 'bg-gray-100 text-gray-800';
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-amber-sunset focus:ring-1 focus:ring-amber-sunset outline-none';

export default function LogsClient() {
  const { firebaseUser, isLoadingAuth } = useAuth();

  const [collectionName, setCollectionName] = useState<'systemAuditLog' | 'logs'>('systemAuditLog');
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [page, setPage] = useState(0);

  // Common filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Audit filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [modifiedBySearch, setModifiedBySearch] = useState('');

  // App log filters
  const [selectedLevel, setSelectedLevel] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');

  const [selectedData, setSelectedData] = useState<Record<string, unknown> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const MIN_LOADING_MS = 300;
  const loadingTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [showLoading, setShowLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (selectedData) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [selectedData]);

  function switchCollection(val: 'systemAuditLog' | 'logs') {
    setCollectionName(val);
    setLogs([]);
    setPage(0);
    setFetched(false);
    setError(null);
  }

  async function handleFetch() {
    if (!firebaseUser) return;

    setError(null);
    const timer = setTimeout(() => setShowLoading(true), MIN_LOADING_MS);
    loadingTimer.current = timer;

    try {
      const constraints: QueryConstraint[] = [];
      const dateField = collectionName === 'systemAuditLog' ? 'date' : 'createdAt';

      if (dateFrom) {
        constraints.push(where(dateField, '>=', new Date(dateFrom).getTime()));
      }
      if (dateTo) {
        constraints.push(where(dateField, '<=', new Date(dateTo).getTime()));
      }

      if (collectionName === 'systemAuditLog') {
        if (selectedType) constraints.push(where('type', '==', selectedType));
        if (selectedAction) constraints.push(where('action', '==', selectedAction));
      } else {
        if (selectedLevel) constraints.push(where('level', '==', selectedLevel));
      }

      constraints.push(orderBy(dateField, 'desc'));

      const q = query(collection(db, collectionName), ...constraints);
      const snap = await getDocs(q);

      const results: Record<string, unknown>[] = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        let date = data[dateField];
        if (date && typeof date === 'object' && 'toMillis' in date) {
          date = (date as Timestamp).toMillis();
        }
        results.push({ id: doc.id, ...data, _date: typeof date === 'number' ? date : Date.now() });
      }

      let filtered = [...results];

      if (collectionName === 'systemAuditLog') {
        if (entitySearch) {
          const q = entitySearch.toLowerCase();
          filtered = filtered.filter((e) => (String(e.entityName ?? '')).toLowerCase().includes(q));
        }
        if (modifiedBySearch) {
          const q = modifiedBySearch.toLowerCase();
          filtered = filtered.filter(
            (e) => (String(e.modifiedByName ?? '')).toLowerCase().includes(q) ||
                    (String(e.modifiedBy ?? '')).toLowerCase().includes(q)
          );
        }
      } else {
        if (codeSearch) {
          const q = codeSearch.toLowerCase();
          filtered = filtered.filter((e) => (String(e.code ?? '')).toLowerCase().includes(q));
        }
        if (messageSearch) {
          const q = messageSearch.toLowerCase();
          filtered = filtered.filter((e) => (String(e.message ?? '')).toLowerCase().includes(q));
        }
      }

      setLogs(filtered);
      setPage(0);
      setFetched(true);
    } catch (err) {
      logger({ level: 'error', code: 'FETCH_LOGS_ERROR', message: 'Error fetching logs:', data: err });
      setError(err instanceof Error ? err.message : 'Error al cargar logs');
    } finally {
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
        loadingTimer.current = null;
      }
      setShowLoading(false);
      setLoading(false);
    }
  }

  function handleClear() {
    setDateFrom('');
    setDateTo('');
    setSelectedType('');
    setSelectedAction('');
    setEntitySearch('');
    setModifiedBySearch('');
    setSelectedLevel('');
    setCodeSearch('');
    setMessageSearch('');
    setLogs([]);
    setPage(0);
    setFetched(false);
  }

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Loader />
      </div>
    );
  }

  const isAudit = collectionName === 'systemAuditLog';

  return (
    <RoleGuard requiredRole="superadmin" fallback={
      <div className="flex items-center justify-center min-h-screen w-full">
        <p className="text-xl text-red-600 font-semibold">No tenés permisos para ver esta página.</p>
      </div>
    }>
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 w-full max-w-7xl">
        {/* Header + collection toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-dark sm:mr-auto">
            {isAudit ? 'Auditoría del Sistema' : 'Logs de la App'}
          </h1>
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
            {COLLECTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => switchCollection(c.value)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  collectionName === c.value
                    ? 'bg-white text-green-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-white rounded-xl p-3 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
          </div>

          {isAudit ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Tipo</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={inputClass}>
                  {AUDIT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Acción</label>
                <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className={inputClass}>
                  {AUDIT_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Entidad</label>
                <input type="text" placeholder="Buscar por nombre..." value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Modificado por</label>
                <input type="text" placeholder="Nombre o ID..." value={modifiedBySearch} onChange={(e) => setModifiedBySearch(e.target.value)} className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Nivel</label>
                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className={inputClass}>
                  {LOG_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Código</label>
                <input type="text" placeholder="Ej: FETCH_ANIMALS" value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Mensaje</label>
                <input type="text" placeholder="Buscar en mensaje..." value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 items-end sm:col-span-2 lg:col-span-3">
            <button
              onClick={handleFetch}
              disabled={loading || showLoading}
              className="flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-sunset to-caramel-deep px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <SearchIcon size={20} title="Buscar" />
              )}
              {showLoading ? 'Buscando...' : 'Buscar logs'}
            </button>
            <button onClick={handleClear} className="rounded-full border border-gray-300 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100">
              Limpiar filtros
            </button>
            {fetched && (
              <span className="text-xs sm:text-sm text-gray-500 self-center ml-auto">
                {logs.length} {logs.length === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>
        </section>

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        {/* Results */}
        {fetched && !loading && !showLoading && (
          <>
            {logs.length === 0 ? (
              <div className="bg-white rounded-xl p-6 sm:p-12 text-center text-gray-500">
                <EyeIcon size={36} className="sm:size-48 mx-auto mb-4 opacity-30" title="Sin resultados" />
                <p className="text-base sm:text-lg font-semibold">No se encontraron registros</p>
                <p className="text-xs sm:text-sm">Probá con otros filtros.</p>
              </div>
            ) : isAudit ? (
              /* ── Audit table ── */
              <div className="bg-white rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Fecha</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Tipo</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Acción</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Entidad</th>
                        <th className="hidden sm:table-cell text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Modificado por</th>
                        <th className="hidden md:table-cell text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">ID</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Cambios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE).map((log) => {
                        const d = log as Record<string, unknown>;
                        return (
                          <tr key={d.id as string} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">{formatDate(d._date as number)}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"><span className="text-gray-700">{getTypeLabel(d.type as string)}</span></td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getActionBadge(d.action as string)}`}>{getActionLabel(d.action as string)}</span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-[120px] sm:max-w-[200px] truncate" title={(d.entityName as string) ?? (d.entityId as string)}>{d.entityName as string ?? '—'}</td>
                            <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-[150px] truncate" title={(d.modifiedByName as string) ?? (d.modifiedBy as string)}>{d.modifiedByName as string ?? (d.modifiedBy as string)}</td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3"><code className="text-xs text-gray-500">{(d.entityId as string)?.slice(0, 8)}...</code></td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              {d.changes ? (
                                <button onClick={() => setSelectedData(d.changes as Record<string, unknown>)} className="text-xs font-semibold text-amber-sunset hover:text-caramel-deep underline transition-colors whitespace-nowrap">Ver</button>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} total={logs.length} onPageChange={setPage} />}
              </div>
            ) : (
              /* ── App logs table ── */
              <div className="bg-white rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Fecha</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Nivel</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Código</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Mensaje</th>
                        <th className="hidden sm:table-cell text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Error Type</th>
                        <th className="hidden md:table-cell text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Status</th>
                        <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE).map((log) => {
                        const d = log as Record<string, unknown>;
                        const hasData = d.data != null && d.data !== '';
                        return (
                          <tr key={d.id as string} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">{formatDate(d._date as number)}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getLevelBadge(d.level as string)}`}>{(d.level as string)?.toUpperCase()}</span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">{d.code as string}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-[200px] sm:max-w-[300px] truncate" title={d.message as string}>{d.message as string}</td>
                            <td className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-gray-500">{d.errorType as string ?? '—'}</td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3">{d.statusCode != null ? <code className="text-xs text-gray-500">{d.statusCode as number}</code> : '—'}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              {hasData ? (
                                <button onClick={() => setSelectedData({ data: d.data })} className="text-xs font-semibold text-amber-sunset hover:text-caramel-deep underline transition-colors whitespace-nowrap">Ver</button>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} total={logs.length} onPageChange={setPage} />}
              </div>
            )}
          </>
        )}

        {/* Empty state before first fetch */}
        {!fetched && !loading && !showLoading && (
          <div className="bg-white rounded-xl p-6 sm:p-12 text-center text-gray-500">
            <EyeIcon size={36} className="sm:size-48 mx-auto mb-4 opacity-30" title="Auditoría" />
            <p className="text-base sm:text-lg font-semibold">Usá los filtros y presioná &quot;Buscar logs&quot;</p>
            <p className="text-xs sm:text-sm">Mostrará hasta {ITEMS_PER_PAGE} resultados ordenados por fecha descendente.</p>
          </div>
        )}
      </div>

      {/* Data dialog */}
      <dialog
        ref={dialogRef}
        onClose={() => setSelectedData(null)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            setSelectedData(null);
          }
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop:bg-black/50 rounded-xl shadow-2xl p-0 max-w-2xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] m-0"
      >
        {selectedData && (
          <div className="bg-white rounded-xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-green-dark">Detalle</h2>
              <button onClick={() => setSelectedData(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(selectedData, null, 2)}
              </pre>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setSelectedData(null)} className="rounded-full border border-gray-300 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100">Cerrar</button>
            </div>
          </div>
        )}
      </dialog>
    </RoleGuard>
  );
}

/* ── Pagination sub-component ── */

function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t border-gray-200">
      <span className="text-xs sm:text-sm text-gray-500">Página {page + 1} de {totalPages} ({total} resultados)</span>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
          className="rounded-full border border-gray-300 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >Anterior</button>
        <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
          className="rounded-full border border-gray-300 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >Siguiente</button>
      </div>
    </div>
  );
}
