'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { handlePromiseToast } from '@/lib/handleToast';

import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import {
  CalendarIcon,
  PetsIcon,
  PhoneIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@/components/Icons';
import EventModal from '@/components/EventModal';
import { mapToFollowup, AdoptedAnimalFollowup } from '@/lib/data/seguimientos';
import { formatedDateOnly, createTimestamp } from '@/lib/dateUtils';
import { Animal, AnimalTransactionType, PrivateInfoType } from '@/types';
import { logger } from '@/lib/logger';

const MIN_LOADING_TIME = 600;

type FilterStatus = 'pendiente' | 'al_dia' | 'sin_seguimiento' | 'cerrados' | 'todos';
type FilterSterilized = 'todos' | 'si' | 'no' | 'no_se';
type FilterSpecies = 'todos' | 'perro' | 'gato';

type SortField = 'animalName' | 'contactName' | 'caseManager' | 'adoptionDate' | 'isSterilized' | 'vaccinations' | 'nextFollowUpDate' | 'animalId';

function sortArrow(field: SortField, current: SortField, dir: 'asc' | 'desc'): string {
  if (field !== current) return '↕';
  return dir === 'asc' ? '↑' : '↓';
}

/**
 * Builds the Firestore filter array for the active status view.
 * Returns null for "todos" (fetches all adopted without extra filter).
 */
function buildFilter(status: FilterStatus, now: number): [string, '==' | '>' | '<=' | '<', string | number | boolean][] | null {
  const base: [string, '==' | '>' | '<=' | '<', string | number | boolean][] = [
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

  // --- EventModal state ---
  const [eventModalAnimal, setEventModalAnimal] = useState<Animal | null>(null);
  const [eventModalPrivateInfo, setEventModalPrivateInfo] = useState<PrivateInfoType | null>(null);
  const [_eventModalTransactions, setEventModalTransactions] = useState<AnimalTransactionType[]>([]);
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventModalLoading, setEventModalLoading] = useState<boolean>(false);

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

        setData(
          adoptedPrivateInfo.map((doc) =>
            mapToFollowup(doc as PrivateInfoType)
          )
        );
      } catch (error) {
        logger({ level: 'error', code: 'FETCH_SEGUIMIENTOS_ERROR', message: 'Error fetching seguimientos:', data: error });
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
      result = result.filter((f) => f.isSterilized === (filterSterilized === 'no_se' ? 'no_se' : filterSterilized));
    }

    if (searchName.trim()) {
      const lower = searchName.toLowerCase();
      result = result.filter(
        (f) =>
          f.animalName.toLowerCase().includes(lower) ||
          (f.contactName || '').toLowerCase().includes(lower) ||
          f.animalId.toLowerCase().includes(lower)
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
        case 'contactName':
          cmp = (a.contactName || '').localeCompare(b.contactName || '');
          break;
        case 'caseManager':
          cmp = (a.caseManager || '').localeCompare(b.caseManager || '');
          break;
        case 'adoptionDate':
          cmp = (a.adoptionDate || Number.MAX_SAFE_INTEGER) - (b.adoptionDate || Number.MAX_SAFE_INTEGER);
          break;
        case 'isSterilized':
          cmp = (sterilizedOrder[a.isSterilized] ?? 99) - (sterilizedOrder[b.isSterilized] ?? 99);
          break;
        case 'vaccinations':
          cmp = (a.vaccinations?.length ?? 0) - (b.vaccinations?.length ?? 0);
          break;
        case 'nextFollowUpDate':
          cmp = (a.nextFollowUpDate || Number.MAX_SAFE_INTEGER) - (b.nextFollowUpDate || Number.MAX_SAFE_INTEGER);
          break;
        case 'animalId':
          cmp = a.animalId.localeCompare(b.animalId);
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
      if (followup.nextFollowUpDate - now <= SEVEN_DAYS_MS) return 'bg-orange-50 border-l-4 border-amber-500';
      return '';
    },
    [now, SEVEN_DAYS_MS]
  );

  const formatContactPhone = useCallback((followup: AdoptedAnimalFollowup): string => {
    const phoneContact = followup.contacts?.find((c) => c.type === 'celular');
    return phoneContact ? String(phoneContact.value) : '';
  }, []);

  const handleSort = useCallback((field: SortField): void => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

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

      setData(
        adoptedPrivateInfo.map((doc) =>
          mapToFollowup(doc as PrivateInfoType)
        )
      );
    } catch (error) {
      logger({ level: 'error', code: 'REFRESH_SEGUIMIENTOS', message: 'Error refreshing seguimientos:', data: error });
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

  const openEventModalForAnimal = async (followup: AdoptedAnimalFollowup): Promise<void> => {
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
      logger({ level: 'error', code: 'FETCH_ANIMAL_FOR_MODAL', message: 'Error fetching animal for modal:', data: error });
    } finally {
      setEventModalLoading(false);
    }
  };

  const toggleFollowUpStatus = async (animalId: string, currentStatus: 'active' | 'closed'): Promise<void> => {
    const newStatus: 'active' | 'closed' = currentStatus === 'active' ? 'closed' : 'active';
    const docRef = doc(db, 'animalPrivateInfo', animalId);

    // Optimistic UI
    setData((prev) =>
      prev.map((f) => (f.animalId === animalId ? { ...f, followUpStatus: newStatus } : f))
    );

    try {
      await handlePromiseToast(
        updateDoc(docRef, { followUpStatus: newStatus }),
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
      logger({ level: 'error', code: 'TOGGLE_FOLLOWUP_STATUS', message: 'Error toggling follow-up status:', data: error });
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

        {/* Table */}
        <div className="w-full max-w-7xl overflow-x-auto bg-white rounded-xl shadow-sm">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <PetsIcon size={64} color="currentColor" title="Sin resultados" className="mb-4 opacity-50" />
              <p className="text-xl">No se encontraron seguimientos</p>
              <p className="text-sm mt-2">Prueba ajustando los filtros</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-green-forest text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    <button onClick={() => handleSort('animalName')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      Mascota <span className="text-xs opacity-70">{sortArrow('animalName', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                    <button onClick={() => handleSort('animalId')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      ID <span className="text-xs opacity-70">{sortArrow('animalId', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">
                    <button onClick={() => handleSort('contactName')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      Adoptante <span className="text-xs opacity-70">{sortArrow('contactName', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">
                    <button onClick={() => handleSort('caseManager')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      Responsable <span className="text-xs opacity-70">{sortArrow('caseManager', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">
                    <button onClick={() => handleSort('adoptionDate')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      Adopción <span className="text-xs opacity-70">{sortArrow('adoptionDate', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    <button onClick={() => handleSort('isSterilized')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full justify-center">
                      Castrado <span className="text-xs opacity-70">{sortArrow('isSterilized', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">
                    <button onClick={() => handleSort('vaccinations')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full justify-center">
                      Vacunas <span className="text-xs opacity-70">{sortArrow('vaccinations', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <button onClick={() => handleSort('nextFollowUpDate')} className="flex items-center gap-1 hover:text-amber-sunset transition-colors cursor-pointer w-full text-left">
                      Próx. Seguimiento <span className="text-xs opacity-70">{sortArrow('nextFollowUpDate', sortField, sortDirection)}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">Acciones</th>
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
                          <div>
                            <span className="font-semibold">{followup.animalName}</span>
                            <span className="text-xs text-gray-400 block sm:hidden">
                              {followup.contactName || 'Sin contacto'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">
                          {followup.animalId}
                        </code>
                      </td>

                      {/* Adoptante */}
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

                      {/* Responsable */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-700">{followup.caseManager || '—'}</span>
                      </td>

                      {/* Adopción */}
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                        {followup.adoptionDate ? formatedDateOnly(followup.adoptionDate) : '—'}
                      </td>

                      {/* Castrado */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sterilizedBadge}`}>
                          {sterilizedLabel}
                        </span>
                      </td>

                      {/* Vacunas */}
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

                      {/* Próximo Seguimiento */}
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

                      {/* Acciones */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEventModalForAnimal(followup)}
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
                            onClick={() => toggleFollowUpStatus(followup.animalId, followup.followUpStatus)}
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
            <span className="w-3 h-3 rounded-sm bg-red-50 border-l-4 border-red-500 inline-block" /> Vencido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-orange-50 border-l-4 border-amber-500 inline-block" /> Próximo (≤7 días)
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
