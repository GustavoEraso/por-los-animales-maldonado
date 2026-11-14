'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getFirestorePage } from '@/lib/firebase/getFirestoreData';
import type { FirestoreFilter } from '@/lib/firebase/getFirestoreData';
import { searchApplicantProfiles } from '@/lib/applicants/search';
import { getStoredApplicantCount } from '@/lib/applicants/counts';
import { logger } from '@/lib/logger';
import type { ApplicantProfile } from '@/types';

const MIN_LOADING_TIME = 600;
const PAGE_SIZE = 25;

type ListFilter = 'all' | 'blacklist' | 'needs_review' | 'merged' | 'with_adoptions';

function matchesListFilter(profile: ApplicantProfile, filter: ListFilter): boolean {
  switch (filter) {
    case 'blacklist':
      return profile.blacklist?.active ?? false;
    case 'needs_review':
      return profile.identityStatus === 'needs_review';
    case 'merged':
      return profile.identityStatus === 'merged';
    case 'with_adoptions':
      return (getStoredApplicantCount(profile.adoptionCount) ?? 0) > 0;
    default:
      return true;
  }
}

function buildApplicantFilters(filter: ListFilter): FirestoreFilter[] {
  switch (filter) {
    case 'blacklist':
      return [['blacklist.active', '==', true]];
    case 'needs_review':
      return [['identityStatus', '==', 'needs_review']];
    case 'merged':
      return [['identityStatus', '==', 'merged']];
    case 'with_adoptions':
      return [['adoptionCount', '>', 0]];
    default:
      return [];
  }
}

/**
 * Returns the server-side order for a filter.
 *
 * Equality filters combined with `orderBy('lastSeenAt')` require composite
 * indexes. To keep the feature deployable without manual index creation,
 * filtered views are ordered by their own field (or by document ID) and then
 * sorted by `lastSeenAt` on the client.
 */
function getPageOrder(filter: ListFilter): {
  orderBy?: 'lastSeenAt' | 'adoptionCount';
  direction: 'asc' | 'desc';
} {
  switch (filter) {
    case 'all':
      return { orderBy: 'lastSeenAt', direction: 'desc' };
    case 'with_adoptions':
      return { orderBy: 'adoptionCount', direction: 'desc' };
    default:
      return { orderBy: undefined, direction: 'desc' };
  }
}

/**
 * Admin list of applicant profiles (fichas de postulantes).
 * Client component that loads profiles page by page and offers prefix search
 * by name, phone or email plus filters for blacklist, identity status and
 * adoptions. Each row links to the applicant detail page.
 *
 * @example
 * // Accessed via /plam-admin/postulantes
 */
function PostulantesList() {
  const [profiles, setProfiles] = useState<ApplicantProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [filter, setFilter] = useState<ListFilter>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [submittedSearch, setSubmittedSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ApplicantProfile[] | null>(null);
  const [searchHasMore, setSearchHasMore] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load the first page when the filter changes or when a search is cleared.
  // While a search is active the paginated list is not touched.
  useEffect(() => {
    if (searchResults !== null) return;

    let cancelled = false;
    const start = Date.now();
    setLoading(true);

    const fetchFirstPage = async () => {
      try {
        const pageOrder = getPageOrder(filter);
        const page = await getFirestorePage({
          currentCollection: 'applicantProfiles',
          filter: buildApplicantFilters(filter),
          orderBy: pageOrder.orderBy,
          direction: pageOrder.direction,
          pageSize: PAGE_SIZE,
        });

        if (cancelled) return;
        setProfiles(page.items);
        setLastDoc(page.lastDoc);
        setHasMore(page.hasMore);
      } catch (error) {
        console.error('[FETCH_APPLICANTS_ERROR]', error);
        logger({
          level: 'error',
          code: 'FETCH_APPLICANTS_ERROR',
          message: 'Error fetching applicant profiles:',
          data: error,
        });
      } finally {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };

    fetchFirstPage();

    return () => {
      cancelled = true;
    };
  }, [filter, searchResults]);

  const handleLoadMore = async (): Promise<void> => {
    if (!lastDoc || loadingMore) return;

    setLoadingMore(true);
    try {
      const pageOrder = getPageOrder(filter);
      const page = await getFirestorePage({
        currentCollection: 'applicantProfiles',
        filter: buildApplicantFilters(filter),
        orderBy: pageOrder.orderBy,
        direction: pageOrder.direction,
        pageSize: PAGE_SIZE,
        startAfterDoc: lastDoc,
      });
      setProfiles((previous) => [...previous, ...page.items]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('[FETCH_MORE_APPLICANTS_ERROR]', error);
      logger({
        level: 'error',
        code: 'FETCH_MORE_APPLICANTS_ERROR',
        message: 'Error fetching more applicant profiles:',
        data: error,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const term = searchInput.trim();
    if (term.length < 2) {
      setSearchError('Ingresá al menos 2 caracteres para buscar.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const result = await searchApplicantProfiles(term);
      setSubmittedSearch(result.term);
      setSearchResults(result.profiles);
      setSearchHasMore(result.hasMore);
    } catch (error) {
      logger({
        level: 'error',
        code: 'SEARCH_APPLICANTS_ERROR',
        message: 'Error searching applicant profiles:',
        data: error,
      });
      setSearchError('No se pudo buscar. Intentá de nuevo.');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = (): void => {
    setSearchInput('');
    setSubmittedSearch('');
    setSearchResults(null);
    setSearchHasMore(false);
    setSearchError(null);
  };

  const displayedProfiles = useMemo(() => {
    const source = searchResults ?? profiles;
    return source
      .filter((profile) => matchesListFilter(profile, filter))
      .sort((first, second) => (second.lastSeenAt ?? '').localeCompare(first.lastSeenAt ?? ''));
  }, [profiles, searchResults, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  const isSearchActive = searchResults !== null;

  const filterOptions: { value: ListFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'blacklist', label: 'En lista negra' },
    { value: 'needs_review', label: 'Requiere revisión' },
    { value: 'with_adoptions', label: 'Con adopciones' },
    { value: 'merged', label: 'Fusionados' },
  ];

  return (
    <main className="flex flex-col min-h-screen p-4 md:px-16 pb-24 gap-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Postulantes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fichas de personas que completaron formularios de adopción
          </p>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {isSearchActive
            ? `${displayedProfiles.length} resultado${displayedProfiles.length === 1 ? '' : 's'}`
            : `${displayedProfiles.length} cargado${displayedProfiles.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 w-full">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            aria-label="Buscar postulantes"
            className="flex-1 min-w-[240px] max-w-md px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
          />
          <button
            type="submit"
            disabled={searching || !searchInput.trim()}
            className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
          {isSearchActive && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700"
            >
              Limpiar
            </button>
          )}
        </form>

        {searchError && <p className="text-sm text-red-600">{searchError}</p>}

        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-green-forest text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isSearchActive && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-gray-600">
            Resultados para <span className="font-semibold">«{submittedSearch}»</span>
          </p>
          {searchHasMore && (
            <p className="text-xs text-amber-700">
              Mostrando los primeros resultados. Refiná la búsqueda para ver menos.
            </p>
          )}
        </div>
      )}

      {displayedProfiles.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {displayedProfiles.map((profile) => {
            const emails = profile.contacts
              ?.filter((contact) => contact.type === 'email')
              .map((contact) => contact.value);
            const phones = profile.contacts
              ?.filter((contact) => contact.type === 'phone')
              .map((contact) => contact.value);
            const isBlacklisted = profile.blacklist?.active ?? false;
            const adoptionCount = getStoredApplicantCount(profile.adoptionCount) ?? 0;

            return (
              <li key={profile.id}>
                <Link
                  href={`/plam-admin/postulantes/${profile.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-green-dark truncate">
                        {profile.canonicalName ?? 'Sin nombre'}
                      </p>
                      {isBlacklisted && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-800 shrink-0">
                          Lista negra
                        </span>
                      )}
                      {profile.identityStatus === 'needs_review' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 shrink-0">
                          Revisión
                        </span>
                      )}
                      {profile.identityStatus === 'merged' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-200 text-gray-600 shrink-0">
                          Fusionado
                        </span>
                      )}
                      {adoptionCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800 shrink-0">
                          {adoptionCount} adop.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {emails?.join(', ') || 'sin email'}{' '}
                      {phones?.length ? `· ${phones.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {profile.formsCount ?? 0} formulario
                      {(profile.formsCount ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {profile.lastSeenAt
                        ? new Date(profile.lastSeenAt).toLocaleDateString('es-UY', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-400">
          <p className="text-lg font-medium">
            {isSearchActive ? 'No se encontraron postulantes' : 'No hay postulantes'}
          </p>
          <p className="text-sm">
            {isSearchActive
              ? 'Probá con otro nombre, teléfono o email.'
              : 'Los postulantes se crean automáticamente cuando llega un formulario'}
          </p>
        </div>
      )}

      {!isSearchActive && hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="self-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          {loadingMore ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </main>
  );
}

export default memo(function PostulantesPageContent() {
  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <PostulantesList />
    </ProtectedRoute>
  );
});
