'use client';

import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { logger } from '@/lib/logger';
import type { ApplicantProfile } from '@/types';

const MIN_LOADING_TIME = 600;

type ListFilter = 'all' | 'blacklist' | 'needs_review' | 'merged' | 'with_adoptions';

/**
 * Admin list of applicant profiles (fichas de postulantes).
 * Client component that loads profiles from Firestore and offers search by
 * name/contact plus filters for blacklist, identity status and adoptions.
 * Each row links to the applicant detail page.
 *
 * @example
 * // Accessed via /plam-admin/postulantes
 */
function PostulantesList() {
  const [profiles, setProfiles] = useState<ApplicantProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<ListFilter>('all');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const start = Date.now();

    const fetchProfiles = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'applicantProfiles',
          orderBy: 'lastSeenAt',
          direction: 'desc',
        });
        setProfiles(data as ApplicantProfile[]);
      } catch (error) {
        console.error('[FETCH_APPLICANTS_ERROR]', error);
        logger({
          level: 'error',
          code: 'FETCH_APPLICANTS_ERROR',
          message: 'Error fetching applicant profiles:',
          data: error,
        });
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

    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'blacklist' && (profile.blacklist?.active ?? false)) ||
        (filter === 'needs_review' && profile.identityStatus === 'needs_review') ||
        (filter === 'merged' && profile.identityStatus === 'merged') ||
        (filter === 'with_adoptions' && (profile.adoptionCount ?? 0) > 0);

      if (!matchesFilter) return false;

      if (!term) return true;

      const nameHit = profile.canonicalName?.toLowerCase().includes(term);
      const aliasHit = profile.nameAliases?.some((alias) => alias.toLowerCase().includes(term));
      const contactHit = profile.contacts?.some((contact) =>
        contact.value.toLowerCase().includes(term)
      );
      return Boolean(nameHit || aliasHit || contactHit);
    });
  }, [profiles, deferredSearch, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

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
        {profiles.length > 0 && (
          <span className="text-sm text-gray-500 font-medium">
            {filteredProfiles.length} de {profiles.length}{' '}
            {profiles.length === 1 ? 'postulante' : 'postulantes'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          aria-label="Buscar postulantes"
          className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
        />
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

      {filteredProfiles.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {filteredProfiles.map((profile) => {
            const emails = profile.contacts
              ?.filter((contact) => contact.type === 'email')
              .map((contact) => contact.value);
            const phones = profile.contacts
              ?.filter((contact) => contact.type === 'phone')
              .map((contact) => contact.value);
            const isBlacklisted = profile.blacklist?.active ?? false;

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
                      {(profile.adoptionCount ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800 shrink-0">
                          {profile.adoptionCount} adop.
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
          <p className="text-lg font-medium">No hay postulantes</p>
          <p className="text-sm">
            Los postulantes se crean automáticamente cuando llega un formulario
          </p>
        </div>
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
