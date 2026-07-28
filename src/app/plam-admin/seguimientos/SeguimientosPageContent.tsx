'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { compareId } from '@/lib/compareId';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { handlePromiseToast } from '@/lib/handleToast';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { postTransactionData } from '@/lib/firebase/dashboardAnalytics';

import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import {
  CalendarIcon,
  PetsIcon,
  PhoneIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  SterilizationIcon,
  VaccinationIcon,
} from '@/components/Icons';
import EventModal from '@/components/EventModal';
import { mapToFollowup, AdoptedAnimalFollowup, normalizeManager } from '@/lib/data/seguimientos';
import { formatedDateOnly, createTimestamp } from '@/lib/dateUtils';
import { Animal, AnimalTransactionType, PrivateInfoType, UserType, EventType } from '@/types';
import { logger } from '@/lib/logger';

const MIN_LOADING_TIME = 600;
const MAX_IN_VALUES = 30;
const MIN_COL_WIDTH = 60;

/** Column key mapped to its width in pixels. */
type ColKey = keyof typeof DEFAULT_COL_WIDTHS;

const DEFAULT_COL_WIDTHS = {
  animalName: 200,
  camada: 110,
  newName: 110,
  id: 140,
  adoptante: 140,
  responsable: 130,
  seguimiento: 130,
  adopcion: 100,
  castrado: 90,
  vacunas: 90,
  proxSeguimiento: 150,
  acciones: 120,
};

/**
 * Merges litterName and litterId from the animals collection into followup records.
 * Batch-fetches animals by IDs in chunks of 30 (Firestore in-query limit).
 */
async function mergeLitterData(
  followups: AdoptedAnimalFollowup[]
): Promise<AdoptedAnimalFollowup[]> {
  if (followups.length === 0) return followups;

  const ids = followups.map((f) => f.animalId);

  const animalMap = new Map<string, Animal>();

  for (let i = 0; i < ids.length; i += MAX_IN_VALUES) {
    const chunk = ids.slice(i, i + MAX_IN_VALUES);
    const docs = await getFirestoreData({
      currentCollection: 'animals',
      filter: [['id', 'in', chunk]],
    });
    for (const doc of docs as Animal[]) {
      animalMap.set(doc.id, doc);
    }
  }

  return followups.map((f) => ({
    ...f,
    litterName: animalMap.get(f.animalId)?.litterName ?? '',
    litterId: animalMap.get(f.animalId)?.litterId ?? '',
  }));
}

type FilterStatus = 'pendiente' | 'al_dia' | 'sin_seguimiento' | 'cerrados' | 'activos' | 'todos';
type FilterSterilized = 'todos' | 'si' | 'no' | 'no_se';
type FilterSpecies = 'todos' | 'perro' | 'gato';

type SortField =
  | 'animalName'
  | 'newName'
  | 'contactName'
  | 'caseManager'
  | 'followUpManager'
  | 'adoptionDate'
  | 'isSterilized'
  | 'vaccinations'
  | 'nextFollowUpDate'
  | 'animalId'
  | 'litterName';

function sortArrow(field: SortField, current: SortField, dir: 'asc' | 'desc'): string {
  if (field !== current) return '↕';
  return dir === 'asc' ? '↑' : '↓';
}

/**
 * Builds the Firestore filter array for the active status view.
 * Returns null for "todos" (fetches all adopted without extra filter).
 */
function buildFilter(
  status: FilterStatus,
  now: number
): [string, '==' | '!=' | '>' | '<=' | '<', string | number | boolean][] | null {
  const base: [string, '==' | '!=' | '>' | '<=' | '<', string | number | boolean][] = [
    ['isAdopted', '==', true],
  ];

  switch (status) {
    case 'pendiente':
      base.push(['followUpStatus', '==', 'active']);
      base.push(['nextFollowUpDate', '>', 0]);
      base.push(['nextFollowUpDate', '<=', now]);
      return base;
    case 'al_dia':
      base.push(['followUpStatus', '==', 'active']);
      base.push(['nextFollowUpDate', '>', now]);
      return base;
    case 'sin_seguimiento':
      base.push(['followUpStatus', '==', 'active']);
      base.push(['nextFollowUpDate', '==', 0]);
      return base;
    case 'cerrados':
      base.push(['followUpStatus', '==', 'closed']);
      return base;
    case 'activos':
      base.push(['followUpStatus', '!=', 'closed']);
      return base;
    case 'todos':
    default:
      return null; // Just isAdopted == true
  }
}

/**
 * Client-side interactive content for the adoption follow-up dashboard.
 * Queries Firestore with compound where clauses so only the documents
 * matching the active filter are read (e.g. ~3 docs for "pendientes"
 * instead of ~350 for "todos"). Client-side sorting only — no post-filtering.
 */
export default function SeguimientosPageContent(): React.ReactElement {
  const [data, setData] = useState<AdoptedAnimalFollowup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pendiente');
  const [filterSterilized, setFilterSterilized] = useState<FilterSterilized>('todos');
  const [filterSpecies, setFilterSpecies] = useState<FilterSpecies>('todos');
  const [searchName, setSearchName] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('nextFollowUpDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCol, setShowCol] = useState({
    id: true,
    adoptante: true,
    newName: false,
    responsable: true,
    seguimiento: true,
    adopcion: true,
    castrado: true,
    vacunas: true,
    proxSeguimiento: true,
    camada: false,
  });
  const toggleCol = (k: keyof typeof showCol): void => setShowCol((p) => ({ ...p, [k]: !p[k] }));

  // --- Column resize ---
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(DEFAULT_COL_WIDTHS);
  const colgroupRef = useRef<HTMLTableColElement>(null);
  const resizingRef = useRef<{ col: ColKey; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (col: ColKey, e: React.MouseEvent): void => {
      e.preventDefault();
      resizingRef.current = { col, startX: e.clientX, startWidth: colWidths[col] };
    },
    [colWidths]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!resizingRef.current || !colgroupRef.current) return;
      const { col, startX, startWidth } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + delta);
      const colEl = colgroupRef.current.querySelector<HTMLTableColElement>(
        `col[data-col="${col}"]`
      );
      if (colEl) {
        colEl.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = (): void => {
      if (!resizingRef.current || !colgroupRef.current) return;
      const { col } = resizingRef.current;
      const colEl = colgroupRef.current.querySelector<HTMLTableColElement>(
        `col[data-col="${col}"]`
      );
      if (colEl) {
        const parsed = parseInt(colEl.style.width, 10);
        if (parsed > 0) {
          setColWidths((prev) => ({ ...prev, [col]: parsed }));
        }
      }
      resizingRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- EventModal state ---
  const [eventModalAnimal, setEventModalAnimal] = useState<Animal | null>(null);
  const [eventModalPrivateInfo, setEventModalPrivateInfo] = useState<PrivateInfoType | null>(null);
  const [_eventModalTransactions, setEventModalTransactions] = useState<AnimalTransactionType[]>(
    []
  );
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventModalLoading, setEventModalLoading] = useState<boolean>(false);
  const [defaultModalEventType, setDefaultModalEventType] = useState<EventType | undefined>(
    undefined
  );
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getFirestoreData({ currentCollection: 'authorizedEmails' });
        setUsers(data as UserType[]);
      } catch {
        /* silently ignore */
      }
    };
    fetchUsers();
  }, []);

  const now = useMemo(() => createTimestamp(), []);
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // Fetch data whenever the status filter changes (new compound query to Firestore)
  useEffect(() => {
    const start = createTimestamp();

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      try {
        const filter = buildFilter(filterStatus, now);

        const adoptedPrivateInfo = filter
          ? await getFirestoreData({
              currentCollection: 'animalPrivateInfo',
              filter,
            })
          : await getFirestoreData({
              currentCollection: 'animalPrivateInfo',
              filter: [['isAdopted', '==', true]],
            });

        const followups = adoptedPrivateInfo.map((doc) => mapToFollowup(doc as PrivateInfoType));
        const enriched = await mergeLitterData(followups);
        setData(enriched);
      } catch (error) {
        logger({
          level: 'error',
          code: 'FETCH_SEGUIMIENTOS_ERROR',
          message: 'Error fetching seguimientos:',
          data: error,
        });
      } finally {
        const elapsed = createTimestamp() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [filterStatus, now]);

  // Client-side filtering (species, sterilization, search — low-cardinality filters)
  const filteredData = useMemo(() => {
    let result = [...data];

    if (filterSpecies !== 'todos') {
      result = result.filter((f) => f.animalSpecies === filterSpecies);
    }

    if (filterSterilized !== 'todos') {
      result = result.filter(
        (f) => f.isSterilized === (filterSterilized === 'no_se' ? 'no_se' : filterSterilized)
      );
    }

    if (searchName.trim()) {
      const lower = searchName.toLowerCase();
      result = result.filter(
        (f) =>
          f.animalName.toLowerCase().includes(lower) ||
          f.newName.toLowerCase().includes(lower) ||
          (f.contactName || '').toLowerCase().includes(lower) ||
          f.animalId.toLowerCase().includes(lower) ||
          f.litterName.toLowerCase().includes(lower) ||
          (f.followUpManager || []).join(' ').toLowerCase().includes(lower)
      );
    }

    // Dynamic client-side sorting
    const sterilizedOrder: Record<string, number> = { si: 0, no: 1, no_se: 2 };
    const dir = sortDirection === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case 'animalName':
          cmp = a.animalName.localeCompare(b.animalName);
          break;
        case 'newName':
          cmp = (a.newName || '').localeCompare(b.newName || '');
          break;
        case 'litterName':
          cmp = (a.litterName || '').localeCompare(b.litterName || '');
          break;
        case 'contactName':
          cmp = (a.contactName || '').localeCompare(b.contactName || '');
          break;
        case 'caseManager':
          cmp = (a.caseManager || []).join(',').localeCompare((b.caseManager || []).join(','));
          break;
        case 'followUpManager':
          cmp = (a.followUpManager || [])
            .join(',')
            .localeCompare((b.followUpManager || []).join(','));
          break;
        case 'adoptionDate':
          cmp =
            (a.adoptionDate || Number.MAX_SAFE_INTEGER) -
            (b.adoptionDate || Number.MAX_SAFE_INTEGER);
          break;
        case 'isSterilized':
          cmp = (sterilizedOrder[a.isSterilized] ?? 99) - (sterilizedOrder[b.isSterilized] ?? 99);
          break;
        case 'vaccinations':
          cmp = (a.vaccinations?.length ?? 0) - (b.vaccinations?.length ?? 0);
          break;
        case 'nextFollowUpDate':
          cmp =
            (a.nextFollowUpDate || Number.MAX_SAFE_INTEGER) -
            (b.nextFollowUpDate || Number.MAX_SAFE_INTEGER);
          break;
        case 'animalId':
          cmp = compareId(a.animalId, b.animalId);
          break;
      }

      return cmp * dir;
    });

    return result;
  }, [data, filterSterilized, filterSpecies, searchName, sortField, sortDirection]);

  const getRowStyle = useCallback(
    (followup: AdoptedAnimalFollowup): string => {
      if (!followup.nextFollowUpDate) return '';
      if (followup.nextFollowUpDate <= now) return 'bg-red-50 border-l-4 border-red-500';
      if (followup.nextFollowUpDate - now <= SEVEN_DAYS_MS)
        return 'bg-orange-50 border-l-4 border-amber-500';
      return '';
    },
    [now, SEVEN_DAYS_MS]
  );

  const formatContactPhone = useCallback((followup: AdoptedAnimalFollowup): string => {
    const phoneContact = followup.contacts?.find((c) => c.type === 'celular');
    return phoneContact ? String(phoneContact.value) : '';
  }, []);

  /** Resolves manager emails to names and formats for table display */
  const getManagerDisplay = useCallback(
    (emails: string[] | undefined): React.ReactNode => {
      const list = normalizeManager(emails);
      if (list.length === 0) return <span className="text-gray-400">—</span>;
      const names = list.map((e) => users.find((u) => u.id === e)?.name ?? e);
      if (list.length === 1)
        return <span className="text-gray-700 truncate block">{names[0]}</span>;
      if (list.length === 2)
        return (
          <span className="text-gray-700">
            {names[0]}
            <br />
            <span className="text-xs text-gray-400">{names[1]}</span>
          </span>
        );
      return (
        <span className="text-gray-700">
          {names[0]}
          <br />
          <span className="text-xs text-gray-400">+{list.length - 1} más</span>
        </span>
      );
    },
    [users]
  );

  const handleSort = useCallback(
    (field: SortField): void => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  const refreshTableData = useCallback(async (): Promise<void> => {
    const start = createTimestamp();
    setLoading(true);
    try {
      const filter = buildFilter(filterStatus, now);

      const adoptedPrivateInfo = filter
        ? await getFirestoreData({
            currentCollection: 'animalPrivateInfo',
            filter,
          })
        : await getFirestoreData({
            currentCollection: 'animalPrivateInfo',
            filter: [['isAdopted', '==', true]],
          });

      const followups = adoptedPrivateInfo.map((doc) => mapToFollowup(doc as PrivateInfoType));
      const enriched = await mergeLitterData(followups);
      setData(enriched);
    } catch (error) {
      logger({
        level: 'error',
        code: 'REFRESH_SEGUIMIENTOS',
        message: 'Error refreshing seguimientos:',
        data: error,
      });
    } finally {
      const elapsed = createTimestamp() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  }, [filterStatus, now]);

  const openEventModalForAnimal = async (
    followup: AdoptedAnimalFollowup,
    eventType?: EventType
  ): Promise<void> => {
    setDefaultModalEventType(eventType);
    setEventModalLoading(true);
    try {
      const [animalDoc, piDoc] = await Promise.all([
        getFirestoreDocById<Animal>({
          currentCollection: 'animals',
          id: followup.animalId,
        }),
        getFirestoreDocById<PrivateInfoType>({
          currentCollection: 'animalPrivateInfo',
          id: followup.animalId,
        }),
      ]);

      if (animalDoc) {
        setEventModalAnimal(animalDoc);
        setEventModalPrivateInfo(piDoc ?? { id: followup.animalId, name: followup.animalName });
        setEventModalTransactions([]);
        setEventModalOpen(true);
      }
    } catch (error) {
      logger({
        level: 'error',
        code: 'FETCH_ANIMAL_FOR_MODAL',
        message: 'Error fetching animal for modal:',
        data: error,
      });
    } finally {
      setEventModalLoading(false);
    }
  };

  const toggleFollowUpStatus = async (
    animalId: string,
    currentStatus: 'active' | 'closed'
  ): Promise<void> => {
    const newStatus: 'active' | 'closed' = currentStatus === 'active' ? 'closed' : 'active';
    const docRef = doc(db, 'animalPrivateInfo', animalId);
    const now = createTimestamp();
    const followup = data.find((f) => f.animalId === animalId);

    const newTransaction: AnimalTransactionType = {
      id: animalId,
      name: followup?.animalName || '',
      transactionType: 'update',
      transactionNote:
        newStatus === 'closed' ? 'Cerrado desde botón rápido' : 'Reabierto desde botón rápido',
      date: now,
      modifiedBy: auth.currentUser?.email || 'system',
      since: now,
      changes: {
        before: { followUpStatus: currentStatus },
        after: { followUpStatus: newStatus },
      },
    };

    setData((prev) =>
      prev.map((f) => (f.animalId === animalId ? { ...f, followUpStatus: newStatus } : f))
    );

    try {
      await createAuditLog({
        type: 'animal',
        action: 'update',
        entityId: animalId,
        entityName: followup?.animalName,
        modifiedBy: auth.currentUser?.email || 'system',
        changes: {
          before: { followUpStatus: currentStatus },
          after: { followUpStatus: newStatus },
        },
      });
      await handlePromiseToast(
        Promise.all([
          updateDoc(docRef, { followUpStatus: newStatus }),
          postTransactionData({ data: newTransaction }),
        ]),
        {
          messages: {
            pending: { title: 'Actualizando', text: 'Cambiando estado de seguimiento...' },
            success: {
              title: 'Listo',
              text: newStatus === 'closed' ? 'Seguimiento cerrado' : 'Seguimiento reabierto',
            },
            error: { title: 'Error', text: 'No se pudo cambiar el estado' },
          },
        }
      );

      await refreshTableData();
    } catch (error) {
      logger({
        level: 'error',
        code: 'TOGGLE_FOLLOWUP_STATUS',
        message: 'Error toggling follow-up status:',
        data: error,
      });
      setData((prev) =>
        prev.map((f) => (f.animalId === animalId ? { ...f, followUpStatus: currentStatus } : f))
      );
    }
  };

  if (loading && !eventModalAnimal) {
    return <Loader />;
  }

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-4 items-center pb-28 min-h-screen">
        {/* Filters */}
        <div className="w-full max-w-7xl">
          <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="flex flex-col gap-1">
              <label htmlFor="status-filter" className="text-sm font-semibold text-green-dark">
                Estado seguimiento
              </label>
              <select
                id="status-filter"
                className="p-2 border border-gray-300 rounded-lg text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              >
                <option value="pendiente">Pendientes</option>
                <option value="al_dia">Al día</option>
                <option value="sin_seguimiento">Sin fecha</option>
                <option value="cerrados">Cerrados</option>
                <option value="activos">Activos</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sterilized-filter" className="text-sm font-semibold text-green-dark">
                Castración
              </label>
              <select
                id="sterilized-filter"
                className="p-2 border border-gray-300 rounded-lg text-sm"
                value={filterSterilized}
                onChange={(e) => setFilterSterilized(e.target.value as FilterSterilized)}
              >
                <option value="todos">Todos</option>
                <option value="si">Castrados</option>
                <option value="no">Sin castrar</option>
                <option value="no_se">No se sabe</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="species-filter" className="text-sm font-semibold text-green-dark">
                Especie
              </label>
              <select
                id="species-filter"
                className="p-2 border border-gray-300 rounded-lg text-sm"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value as FilterSpecies)}
              >
                <option value="todos">Todos</option>
                <option value="perro">Perros</option>
                <option value="gato">Gatos</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="search-filter" className="text-sm font-semibold text-green-dark">
                Buscar
              </label>
              <input
                id="search-filter"
                type="text"
                className="p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Nombre mascota o adoptante..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Column toggles */}
        <ul className="w-full max-w-7xl flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 px-1 pb-1">
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.camada}
                onChange={() => toggleCol('camada')}
                className="mr-1 accent-green-700"
              />
              Camada
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.newName}
                onChange={() => toggleCol('newName')}
                className="mr-1 accent-green-700"
              />
              N. Adoptante
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.id}
                onChange={() => toggleCol('id')}
                className="mr-1 accent-green-700"
              />
              ID
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.adoptante}
                onChange={() => toggleCol('adoptante')}
                className="mr-1 accent-green-700"
              />
              Adoptante
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.responsable}
                onChange={() => toggleCol('responsable')}
                className="mr-1 accent-green-700"
              />
              Responsable
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.seguimiento}
                onChange={() => toggleCol('seguimiento')}
                className="mr-1 accent-green-700"
              />
              Seguimiento
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.adopcion}
                onChange={() => toggleCol('adopcion')}
                className="mr-1 accent-green-700"
              />
              Adopción
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.castrado}
                onChange={() => toggleCol('castrado')}
                className="mr-1 accent-green-700"
              />
              Castrado
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.vacunas}
                onChange={() => toggleCol('vacunas')}
                className="mr-1 accent-green-700"
              />
              Vacunas
            </label>
          </li>
          <li>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={showCol.proxSeguimiento}
                onChange={() => toggleCol('proxSeguimiento')}
                className="mr-1 accent-green-700"
              />
              Próx. Seguimiento
            </label>
          </li>
        </ul>

        {/* Table */}
        <div className="w-full max-w-7xl overflow-x-auto bg-white rounded-xl shadow-sm">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <PetsIcon
                size={64}
                color="currentColor"
                title="Sin resultados"
                className="mb-4 opacity-50"
              />
              <p className="text-xl">No se encontraron seguimientos</p>
              <p className="text-sm mt-2">Prueba ajustando los filtros</p>
            </div>
          ) : (
            <table className="w-full table-fixed text-sm text-left">
              <colgroup ref={colgroupRef}>
                <col data-col="animalName" style={{ width: colWidths.animalName }} />
                {showCol.camada && <col data-col="camada" style={{ width: colWidths.camada }} />}
                {showCol.newName && <col data-col="newName" style={{ width: colWidths.newName }} />}
                {showCol.id && <col data-col="id" style={{ width: colWidths.id }} />}
                {showCol.adoptante && (
                  <col data-col="adoptante" style={{ width: colWidths.adoptante }} />
                )}
                {showCol.responsable && (
                  <col data-col="responsable" style={{ width: colWidths.responsable }} />
                )}
                {showCol.seguimiento && (
                  <col data-col="seguimiento" style={{ width: colWidths.seguimiento }} />
                )}
                {showCol.adopcion && (
                  <col data-col="adopcion" style={{ width: colWidths.adopcion }} />
                )}
                {showCol.castrado && (
                  <col data-col="castrado" style={{ width: colWidths.castrado }} />
                )}
                {showCol.vacunas && <col data-col="vacunas" style={{ width: colWidths.vacunas }} />}
                {showCol.proxSeguimiento && (
                  <col data-col="proxSeguimiento" style={{ width: colWidths.proxSeguimiento }} />
                )}
                <col data-col="acciones" style={{ width: colWidths.acciones }} />
              </colgroup>
              <thead className="bg-green-forest text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold relative">
                    <button
                      onClick={() => handleSort('animalName')}
                      className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                    >
                      <span className="truncate">Mascota </span>
                      <span className="text-xs opacity-70 shrink-0">
                        {sortArrow('animalName', sortField, sortDirection)}
                      </span>
                    </button>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                      onMouseDown={(e) => handleResizeStart('animalName', e)}
                    />
                  </th>
                  {showCol.camada && (
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell relative">
                      <button
                        onClick={() => handleSort('litterName')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Camada </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('litterName', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('camada', e)}
                      />
                    </th>
                  )}
                  {showCol.newName && (
                    <th className="px-4 py-3 font-semibold hidden md:table-cell relative">
                      <button
                        onClick={() => handleSort('newName')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">N. Adoptante </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('newName', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('newName', e)}
                      />
                    </th>
                  )}
                  {showCol.id && (
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell relative">
                      <button
                        onClick={() => handleSort('animalId')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">ID </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('animalId', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('id', e)}
                      />
                    </th>
                  )}
                  {showCol.adoptante && (
                    <th className="px-4 py-3 font-semibold hidden md:table-cell relative">
                      <button
                        onClick={() => handleSort('contactName')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Adoptante </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('contactName', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('adoptante', e)}
                      />
                    </th>
                  )}
                  {showCol.responsable && (
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell relative">
                      <button
                        onClick={() => handleSort('caseManager')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Responsable </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('caseManager', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('responsable', e)}
                      />
                    </th>
                  )}
                  {showCol.seguimiento && (
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell relative">
                      <button
                        onClick={() => handleSort('followUpManager')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Resp. Seguimiento </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('followUpManager', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('seguimiento', e)}
                      />
                    </th>
                  )}
                  {showCol.adopcion && (
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell relative">
                      <button
                        onClick={() => handleSort('adoptionDate')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Adopción </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('adoptionDate', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('adopcion', e)}
                      />
                    </th>
                  )}
                  {showCol.castrado && (
                    <th className="px-4 py-3 font-semibold text-center relative">
                      <button
                        onClick={() => handleSort('isSterilized')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full justify-center min-w-0"
                      >
                        <span className="truncate">Castrado </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('isSterilized', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('castrado', e)}
                      />
                    </th>
                  )}
                  {showCol.vacunas && (
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell relative">
                      <button
                        onClick={() => handleSort('vaccinations')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full justify-center min-w-0"
                      >
                        <span className="truncate">Vacunas </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('vaccinations', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('vacunas', e)}
                      />
                    </th>
                  )}
                  {showCol.proxSeguimiento && (
                    <th className="px-4 py-3 font-semibold relative">
                      <button
                        onClick={() => handleSort('nextFollowUpDate')}
                        className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left min-w-0"
                      >
                        <span className="truncate">Próx. Seguimiento </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {sortArrow('nextFollowUpDate', sortField, sortDirection)}
                        </span>
                      </button>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                        onMouseDown={(e) => handleResizeStart('proxSeguimiento', e)}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-center relative">
                    <span className="truncate">Acciones</span>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-sunset/40 z-10"
                      onMouseDown={(e) => handleResizeStart('acciones', e)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((followup) => {
                  const rowStyle = getRowStyle(followup);
                  const isPastDue = followup.nextFollowUpDate && followup.nextFollowUpDate <= now;
                  const isDueSoon =
                    followup.nextFollowUpDate &&
                    !isPastDue &&
                    followup.nextFollowUpDate - now <= SEVEN_DAYS_MS;
                  const hasVaccines = followup.vaccinations && followup.vaccinations.length > 0;
                  const isClosed = followup.followUpStatus === 'closed';
                  const sterilizedBadge =
                    followup.isSterilized === 'si'
                      ? 'bg-green-100 text-green-800'
                      : followup.isSterilized === 'no'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600';
                  const sterilizedLabel =
                    followup.isSterilized === 'si'
                      ? 'Sí'
                      : followup.isSterilized === 'no'
                        ? 'No'
                        : '?';

                  return (
                    <tr
                      key={followup.animalId}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isClosed ? 'opacity-60' : ''} ${rowStyle}`}
                    >
                      {/* Mascota */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/plam-admin/animales/${followup.animalId}`}
                          className="flex items-center gap-2 hover:text-green-700 transition-colors font-medium text-green-dark"
                        >
                          {followup.animalImageUrl ? (
                            <img
                              src={followup.animalImageUrl}
                              alt={followup.animalName}
                              className="w-8 h-8 rounded-full object-cover hidden sm:block"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-green-forest flex items-center justify-center text-white text-xs hidden sm:flex">
                              <PetsIcon size={16} />
                            </div>
                          )}
                          <div className="max-w-24 truncate">
                            <span className="font-semibold">{followup.animalName}</span>
                            {followup.newName && (
                              <span className="text-xs text-gray-500 block">
                                &ldquo;{followup.newName}&rdquo;
                              </span>
                            )}
                            <span className="text-xs text-gray-400 block sm:hidden">
                              {followup.contactName || 'Sin contacto'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Camada */}
                      {showCol.camada && (
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {followup.litterName ? (
                            <Link
                              href={`/plam-admin/animales/${followup.animalId}`}
                              className="text-sm text-gray-600 hover:text-green-700 hover:underline"
                            >
                              {followup.litterName}
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      )}

                      {/* N. Adoptante */}
                      {showCol.newName && (
                        <td className="px-4 py-3 hidden md:table-cell">
                          {followup.newName ? (
                            <span className="font-medium text-gray-800">{followup.newName}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}

                      {/* ID */}
                      {showCol.id && (
                        <td className="px-4 py-3 hidden sm:table-cell max-w-24 truncate">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono ">
                            {followup.animalId}
                          </code>
                        </td>
                      )}

                      {/* Adoptante */}
                      {showCol.adoptante && (
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {followup.contactName || '—'}
                            </span>
                            {formatContactPhone(followup) && (
                              <a
                                href={`https://wa.me/${formatContactPhone(followup).replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon size={12} />
                                {formatContactPhone(followup)}
                              </a>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Responsable */}
                      {showCol.responsable && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {getManagerDisplay(followup.caseManager)}
                        </td>
                      )}

                      {/* Resp. Seguimiento */}
                      {showCol.seguimiento && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {getManagerDisplay(followup.followUpManager)}
                        </td>
                      )}

                      {/* Adopción */}
                      {showCol.adopcion && (
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                          {followup.adoptionDate ? formatedDateOnly(followup.adoptionDate) : '—'}
                        </td>
                      )}

                      {/* Castrado */}
                      {showCol.castrado && (
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sterilizedBadge}`}
                          >
                            {sterilizedLabel}
                          </span>
                        </td>
                      )}

                      {/* Vacunas */}
                      {showCol.vacunas && (
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          {hasVaccines ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Sí ({followup.vaccinations!.length})
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No
                            </span>
                          )}
                        </td>
                      )}

                      {/* Próximo Seguimiento */}
                      {showCol.proxSeguimiento && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isClosed ? (
                              <span className="text-sm font-medium text-gray-500">—</span>
                            ) : (
                              <>
                                <span
                                  className={`text-sm font-medium ${
                                    isPastDue
                                      ? 'text-red-600'
                                      : isDueSoon
                                        ? 'text-amber-600'
                                        : followup.nextFollowUpDate
                                          ? 'text-green-700'
                                          : 'text-gray-400'
                                  }`}
                                >
                                  {followup.nextFollowUpDate
                                    ? formatedDateOnly(followup.nextFollowUpDate)
                                    : 'Sin fecha'}
                                </span>
                                {isPastDue && (
                                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                    Vencido
                                  </span>
                                )}
                                {isDueSoon && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    Pronto
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Acciones */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEventModalForAnimal(followup, 'sterilization')}
                            disabled={eventModalLoading}
                            className="p-1.5 rounded hover:bg-pink-600 hover:text-white transition-colors text-pink-600"
                            title="Registrar esterilización"
                          >
                            <SterilizationIcon size={16} />
                          </button>
                          <button
                            onClick={() => openEventModalForAnimal(followup, 'vaccination')}
                            disabled={eventModalLoading}
                            className="p-1.5 rounded hover:bg-purple-600 hover:text-white transition-colors text-purple-600"
                            title="Registrar vacunación"
                          >
                            <VaccinationIcon size={16} />
                          </button>
                          <button
                            onClick={() => openEventModalForAnimal(followup, 'followup')}
                            disabled={eventModalLoading}
                            className="p-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-blue-600"
                            title="Registrar evento de seguimiento"
                          >
                            <CalendarIcon size={16} />
                          </button>
                          <Link
                            href={`/plam-admin/animales/${followup.animalId}`}
                            className="p-1.5 rounded hover:bg-green-forest hover:text-white transition-colors"
                            title="Ver ficha completa"
                          >
                            <EyeIcon size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              toggleFollowUpStatus(followup.animalId, followup.followUpStatus)
                            }
                            className={`p-1.5 rounded transition-colors ${
                              isClosed
                                ? 'hover:bg-green-600 hover:text-white text-green-600'
                                : 'hover:bg-gray-600 hover:text-white text-gray-500'
                            }`}
                            title={isClosed ? 'Reabrir seguimiento' : 'Cerrar seguimiento'}
                          >
                            {isClosed ? <LockOpenIcon size={16} /> : <LockClosedIcon size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend */}
        <div className="w-full max-w-7xl flex flex-wrap gap-4 text-xs text-gray-500 px-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-50 border-l-4 border-red-500 inline-block" />{' '}
            Vencido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-orange-50 border-l-4 border-amber-500 inline-block" />{' '}
            Próximo (≤7 días)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-white inline-block border" /> Al día / Sin fecha
          </span>
          <span className="flex items-center gap-1 opacity-60">
            <span className="text-gray-400">Texto gris</span> = Cerrado
          </span>
        </div>

        {/* EventModal controlled from table rows */}
        {eventModalAnimal && eventModalPrivateInfo && (
          <EventModal
            animal={eventModalAnimal}
            privateInfo={eventModalPrivateInfo}
            setAnimal={setEventModalAnimal}
            setPrivateInfo={setEventModalPrivateInfo}
            setAllAnimalTransactions={setEventModalTransactions}
            defaultEventType={defaultModalEventType}
            users={users}
            hideTriggerButton
            isOpen={eventModalOpen}
            setIsOpen={setEventModalOpen}
            onEventSaved={() => {
              refreshTableData();
            }}
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
