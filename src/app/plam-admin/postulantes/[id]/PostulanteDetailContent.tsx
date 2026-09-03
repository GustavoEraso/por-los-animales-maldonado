'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import ReturnButton from '@/components/ReturnButton';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { handlePromiseToast } from '@/lib/handleToast';
import { logger } from '@/lib/logger';
import {
  addApplicantContact,
  editApplicantName,
  mergeApplicantProfiles,
  upsertContact,
} from '@/lib/applicants/applicantService';
import type { ApplicantProfile, AnimalTransactionType, GoogleFormEntry } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const IDENTITY_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  needs_review: 'Requiere revisión',
  merged: 'Fusionada',
};

/**
 * Applicant (ficha de postulante) detail page.
 * Shows the person's identity, contacts, alias history, linked forms, adoption
 * history, notes and blacklist control. Admins can edit the canonical name,
 * add or correct contacts and merge profiles.
 *
 * @example
 * // Accessed via /plam-admin/postulantes/[id]
 */
export default function PostulanteDetailContent({ applicantId }: { applicantId: string }) {
  const { currentUser, checkIsAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [forms, setForms] = useState<GoogleFormEntry[]>([]);
  const [transactions, setTransactions] = useState<AnimalTransactionType[]>([]);
  const [updatingBlacklist, setUpdatingBlacklist] = useState<boolean>(false);
  const [blacklistReason, setBlacklistReason] = useState<string>('');
  const [showBlacklistModal, setShowBlacklistModal] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false);
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactInput, setContactInput] = useState<string>('');
  const [savingContact, setSavingContact] = useState<boolean>(false);
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeSearch, setMergeSearch] = useState<string>('');
  const [mergeCandidates, setMergeCandidates] = useState<ApplicantProfile[]>([]);
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<ApplicantProfile | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  const [merging, setMerging] = useState<boolean>(false);

  const isAdmin = checkIsAdmin();

  useEffect(() => {
    if (!applicantId) return;

    const fetchProfile = async () => {
      try {
        const data = await getFirestoreDocById<ApplicantProfile>({
          currentCollection: 'applicantProfiles',
          id: applicantId,
        });
        setProfile(data ? { ...data, id: applicantId } : null);
        setBlacklistReason(data?.blacklist?.reason ?? '');
        setNameInput(data?.canonicalName ?? '');
      } catch (error) {
        console.error('[FETCH_APPLICANT_ERROR]', error);
        logger({
          level: 'error',
          code: 'FETCH_APPLICANT_ERROR',
          message: 'Error fetching applicant profile:',
          data: error,
        });
      }
    };

    const fetchForms = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'googleForms',
          filter: [['applicantId', '==', applicantId]],
        });
        const sorted = (data as GoogleFormEntry[]).sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        );
        setForms(sorted);
      } catch (error) {
        console.error('[FETCH_APPLICANT_FORMS_ERROR]', error);
        logger({
          level: 'error',
          code: 'FETCH_APPLICANT_FORMS_ERROR',
          message: 'Error fetching applicant forms:',
          data: error,
        });
      }
    };

    const fetchTransactions = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'animalTransactions',
          filter: [['applicantId', '==', applicantId]],
        });
        const sorted = (data as AnimalTransactionType[]).sort((a, b) =>
          (b.date ?? '').toString().localeCompare((a.date ?? '').toString())
        );
        setTransactions(sorted);
      } catch (error) {
        console.error('[FETCH_APPLICANT_TRANSACTIONS_ERROR]', error);
        logger({
          level: 'error',
          code: 'FETCH_APPLICANT_TRANSACTIONS_ERROR',
          message: 'Error fetching applicant transactions:',
          data: error,
        });
      }
    };

    Promise.all([fetchProfile(), fetchForms(), fetchTransactions()]).finally(() =>
      setLoading(false)
    );
  }, [applicantId]);

  const handleAddNote = async (): Promise<void> => {
    if (!profile || !currentUser || !noteText.trim()) return;

    const newNote = {
      text: noteText.trim(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [...(profile.notes ?? []), newNote];

    setAddingNote(true);
    const promise = (async () => {
      await createAuditLog({
        type: 'applicant',
        action: 'update',
        entityId: applicantId,
        entityName: profile.canonicalName ?? applicantId,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: { before: { notesCount: profile.notes?.length ?? 0 }, after: { noteAdded: true } },
      });
      await postFirestoreData<Partial<ApplicantProfile>>({
        data: { notes: nextNotes, updatedAt: newNote.createdAt },
        currentCollection: 'applicantProfiles',
        id: applicantId,
      });
      setProfile({ ...profile, notes: nextNotes });
      setNoteText('');
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Guardando nota...', text: '' },
        success: { title: 'Nota agregada', text: 'La nota se guardó correctamente.' },
        error: { title: 'Error', text: 'No se pudo guardar la nota.' },
      },
    }).finally(() => {
      setAddingNote(false);
    });
  };

  const handleToggleBlacklist = async () => {
    if (!profile || !currentUser) return;

    const currentlyActive = profile.blacklist?.active ?? false;
    const nextActive = !currentlyActive;

    if (nextActive && !blacklistReason.trim()) {
      handlePromiseToast(Promise.reject(new Error('missing reason')), {
        messages: {
          pending: { title: '', text: '' },
          success: { title: '', text: '' },
          error: { title: 'Falta el motivo', text: 'Ingresá un motivo para la lista negra.' },
        },
      });
      return;
    }

    const now = new Date().toISOString();
    const previous = profile.blacklist;
    const updatedBlacklist = {
      active: nextActive,
      reason: blacklistReason.trim() || null,
      activatedAt: nextActive ? now : (profile.blacklist?.activatedAt ?? null),
      activatedBy: nextActive ? currentUser.id : (profile.blacklist?.activatedBy ?? null),
      updatedAt: now,
      updatedBy: currentUser.id,
    };

    setUpdatingBlacklist(true);
    const promise = (async () => {
      await createAuditLog({
        type: 'applicant',
        action: 'update',
        entityId: applicantId,
        entityName: profile.canonicalName ?? applicantId,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: { before: { blacklist: previous }, after: { blacklist: updatedBlacklist } },
      });
      await postFirestoreData<Partial<ApplicantProfile>>({
        data: { blacklist: updatedBlacklist, updatedAt: now },
        currentCollection: 'applicantProfiles',
        id: applicantId,
      });
      setProfile({ ...profile, blacklist: updatedBlacklist, updatedAt: now });
      setShowBlacklistModal(false);
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Guardando...', text: 'Actualizando lista negra' },
        success: {
          title: nextActive ? 'Lista negra activada' : 'Lista negra desactivada',
          text: nextActive
            ? 'El postulante no recibirá evaluación automática'
            : 'Se reactivó la evaluación automática',
        },
        error: { title: 'Error', text: 'No se pudo actualizar la lista negra' },
      },
    }).finally(() => {
      setUpdatingBlacklist(false);
    });
  };

  const handleSaveName = async (): Promise<void> => {
    if (!profile || !currentUser) return;
    setSavingName(true);
    const promise = (async () => {
      await editApplicantName(profile, nameInput, { id: currentUser.id, name: currentUser.name });
      setProfile((prev) =>
        prev
          ? { ...prev, canonicalName: nameInput.trim(), updatedAt: new Date().toISOString() }
          : prev
      );
      setShowEditNameModal(false);
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Guardando nombre...', text: '' },
        success: { title: 'Nombre actualizado', text: 'El nombre principal se actualizó.' },
        error: { title: 'Error', text: 'No se pudo actualizar el nombre.' },
      },
    }).finally(() => setSavingName(false));
  };

  const handleSaveContact = async (): Promise<void> => {
    if (!profile || !currentUser) return;
    setSavingContact(true);
    const promise = (async () => {
      await addApplicantContact(profile, contactType, contactInput, {
        id: currentUser.id,
        name: currentUser.name,
      });
      setProfile((prev) => {
        if (!prev) return prev;
        const nextContacts = upsertContact(prev.contacts ?? [], contactType, contactInput);
        return { ...prev, contacts: nextContacts, updatedAt: new Date().toISOString() };
      });
      setShowAddContactModal(false);
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Guardando contacto...', text: '' },
        success: { title: 'Contacto agregado', text: 'El contacto se guardó correctamente.' },
        error: { title: 'Error', text: 'No se pudo guardar el contacto.' },
      },
    }).finally(() => setSavingContact(false));
  };

  const handleSearchMergeCandidates = async (): Promise<void> => {
    if (!profile || !mergeSearch.trim()) return;
    setLoadingCandidates(true);
    try {
      const term = mergeSearch.trim().toLowerCase();
      const data = await getFirestoreData({
        currentCollection: 'applicantProfiles',
      });
      const candidates = (data as ApplicantProfile[]).filter(
        (candidate) =>
          candidate.id !== profile.id &&
          (candidate.canonicalName?.toLowerCase().includes(term) ||
            candidate.nameAliases?.some((alias) => alias.toLowerCase().includes(term)) ||
            candidate.contacts?.some((contact) => contact.value.toLowerCase().includes(term)))
      );
      setMergeCandidates(candidates.slice(0, 20));
    } catch (error) {
      console.error('[MERGE_SEARCH_ERROR]', error);
      logger({
        level: 'error',
        code: 'MERGE_SEARCH_ERROR',
        message: 'Error searching merge candidates:',
        data: error,
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleMerge = async (): Promise<void> => {
    if (!profile || !currentUser || !selectedMergeTarget) return;
    setMerging(true);
    const promise = (async () => {
      await mergeApplicantProfiles(profile, selectedMergeTarget, {
        id: currentUser.id,
        name: currentUser.name,
      });
      // Navigate to the surviving profile after a successful merge.
      router.push(`/plam-admin/postulantes/${selectedMergeTarget.id}`);
    })();

    await handlePromiseToast(promise, {
      messages: {
        pending: { title: 'Fusionando fichas...', text: 'Reasignando formularios y contactos.' },
        success: { title: 'Fichas fusionadas', text: 'Se fusionó la ficha correctamente.' },
        error: { title: 'Error', text: 'No se pudieron fusionar las fichas.' },
      },
    }).finally(() => {
      setMerging(false);
      setShowMergeModal(false);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-gray-500">Postulante no encontrado.</p>
          <ReturnButton />
        </div>
      </ProtectedRoute>
    );
  }

  const isBlacklisted = profile.blacklist?.active ?? false;
  const identityStatus = profile.identityStatus ?? 'active';
  const formsCount = profile.formsCount ?? forms.length;
  const adoptionCount = profile.adoptionCount ?? 0;
  const returnCount = profile.returnCount ?? 0;

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <main className="flex flex-col min-h-screen p-4 md:px-16 pb-24 gap-6 max-w-4xl mx-auto w-full">
        <div className="flex items-start gap-3">
          <ReturnButton />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {profile.canonicalName ?? 'Sin nombre'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {IDENTITY_STATUS_LABELS[identityStatus] ?? identityStatus}
              </span>
            </div>
            {profile.lastSeenAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Última actividad:{' '}
                {new Date(profile.lastSeenAt).toLocaleDateString('es-UY', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
            {profile.firstSeenAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Primer contacto:{' '}
                {new Date(profile.firstSeenAt).toLocaleDateString('es-UY', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.canonicalName ?? '');
                setShowEditNameModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700"
            >
              Editar nombre
            </button>
            <button
              type="button"
              onClick={() => {
                setContactType('email');
                setContactInput('');
                setShowAddContactModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700"
            >
              Agregar contacto
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMergeModal(true);
                setMergeSearch('');
                setMergeCandidates([]);
                setSelectedMergeTarget(null);
              }}
              className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-sm font-semibold text-amber-800"
            >
              Fusionar fichas
            </button>
          </div>
        )}

        {isBlacklisted && (
          <div className="flex flex-col gap-1 bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-sm font-semibold text-red-800">En lista negra</span>
            {profile.blacklist?.reason && (
              <p className="text-sm text-red-700">{profile.blacklist.reason}</p>
            )}
            {profile.blacklist?.updatedAt && (
              <p className="text-xs text-red-500">
                Actualizado por {profile.blacklist.updatedBy ?? '—'} el{' '}
                {new Date(profile.blacklist.updatedAt).toLocaleDateString('es-UY')}
              </p>
            )}
          </div>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowBlacklistModal(true)}
            disabled={updatingBlacklist}
            className={`self-start px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              isBlacklisted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isBlacklisted ? 'Quitar de lista negra' : 'Agregar a lista negra'}
          </button>
        )}

        {showBlacklistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-green-dark">
                {isBlacklisted ? 'Desactivar lista negra' : 'Agregar a lista negra'}
              </h2>
              <p className="text-sm text-gray-600">
                La lista negra impide que un nuevo formulario de este postulante reciba evaluación
                automática de IA.
              </p>
              {!isBlacklisted && (
                <textarea
                  value={blacklistReason}
                  onChange={(event) => setBlacklistReason(event.target.value)}
                  placeholder="Motivo de la lista negra..."
                  aria-label="Motivo de la lista negra"
                  rows={3}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBlacklistModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleToggleBlacklist}
                  disabled={updatingBlacklist}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-green-dark">Editar nombre principal</h2>
              <input
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Nombre principal..."
                aria-label="Nombre principal"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName || !nameInput.trim()}
                  className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-green-dark">Agregar contacto</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContactType('email')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    contactType === 'email'
                      ? 'bg-green-forest text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setContactType('phone')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    contactType === 'phone'
                      ? 'bg-green-forest text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Teléfono
                </button>
              </div>
              <input
                type={contactType === 'email' ? 'email' : 'tel'}
                value={contactInput}
                onChange={(event) => setContactInput(event.target.value)}
                placeholder={contactType === 'email' ? 'persona@correo.com' : '099 123 456'}
                aria-label="Nuevo contacto"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveContact}
                  disabled={savingContact || !contactInput.trim()}
                  className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {showMergeModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-green-dark">Fusionar fichas</h2>
              <p className="text-sm text-gray-600">
                Fusionar <strong>{profile.canonicalName ?? profile.id}</strong> dentro de otra ficha
                moverá sus formularios, adopciones, contactos y notas a la ficha destino. Esta
                acción no se puede deshacer.
              </p>
              <input
                type="search"
                value={mergeSearch}
                onChange={(event) => setMergeSearch(event.target.value)}
                placeholder="Buscar ficha destino por nombre o contacto..."
                aria-label="Buscar ficha destino"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleSearchMergeCandidates}
                disabled={loadingCandidates || !mergeSearch.trim()}
                className="self-start px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-sm font-semibold text-white disabled:opacity-50"
              >
                Buscar
              </button>

              {selectedMergeTarget && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="text-sm font-semibold text-amber-800">Destino:</span>
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {selectedMergeTarget.canonicalName ?? selectedMergeTarget.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMergeTarget(null)}
                    className="text-xs text-amber-700 underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {!selectedMergeTarget && mergeCandidates.length > 0 && (
                <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {mergeCandidates.map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedMergeTarget(candidate)}
                        className="w-full text-left flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-3 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {candidate.canonicalName ?? 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {candidate.contacts
                              ?.filter((contact) => contact.type === 'email')
                              .map((contact) => contact.value)
                              .join(', ') || 'sin email'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">
                          {candidate.formsCount ?? 0} form.
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={merging || !selectedMergeTarget}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Confirmar fusión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-dark">{formsCount}</p>
            <p className="text-xs text-gray-500">Formularios</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-dark">{adoptionCount}</p>
            <p className="text-xs text-gray-500">Adopciones</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-dark">{returnCount}</p>
            <p className="text-xs text-gray-500">Retornos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-dark">{profile.contacts?.length ?? 0}</p>
            <p className="text-xs text-gray-500">Contactos</p>
          </div>
        </section>

        {/* Contacts */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-green-dark">Contactos</h2>
          {profile.contacts && profile.contacts.length > 0 ? (
            <ul className="flex flex-col gap-2 mt-3">
              {profile.contacts.map((contact, index) => (
                <li key={`${contact.type}-${contact.normalizedValue}-${index}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {contact.type === 'email' ? 'Email' : 'Teléfono'}
                    </span>
                    <span className="text-sm text-gray-800">{contact.value}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Visto en {contact.sourceFormIds.length}{' '}
                    {contact.sourceFormIds.length === 1 ? 'formulario' : 'formularios'}
                    {contact.labels?.includes('manual') ? ' · agregado manualmente' : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 mt-3">Sin contactos registrados.</p>
          )}
        </section>

        {/* Aliases */}
        {profile.nameAliases && profile.nameAliases.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-green-dark">Nombres usados</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.nameAliases.map((alias, index) => (
                <span
                  key={`${alias}-${index}`}
                  className="text-xs px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600"
                >
                  {alias}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Linked forms */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-green-dark">Formularios</h2>
          {forms.length > 0 ? (
            <ul className="flex flex-col gap-2 mt-3">
              {forms.map((form) => {
                const status = form.status ?? 'pending';
                const score = form.evaluation?.score;
                return (
                  <li key={form.id}>
                    <Link
                      href={`/plam-admin/formularios/${form.id}`}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-3 hover:border-green-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">
                          {form.createdAt
                            ? new Date(form.createdAt).toLocaleDateString('es-UY', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                        {form.selectedPet && (
                          <p className="text-xs text-gray-400 truncate">
                            Mascota: {form.selectedPet}
                          </p>
                        )}
                        {form.decisionReason && (
                          <p className="text-xs text-gray-500 mt-1">
                            Motivo: {form.decisionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                        {score !== undefined && (
                          <span className="text-xs font-semibold text-gray-600">Score {score}</span>
                        )}
                        {form.evaluationState === 'skipped_blacklist' && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
                            Evaluación omitida
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 mt-3">Este postulante aún no tiene formularios.</p>
          )}
        </section>

        {/* Adoptions / returns history */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-green-dark">Adopciones y retornos</h2>
          {transactions.length > 0 ? (
            <ul className="flex flex-col gap-2 mt-3">
              {transactions.map((transaction) => (
                <li
                  key={`${transaction.date}-${transaction.transactionType}`}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-3"
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      transaction.transactionType === 'adoption'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {transaction.transactionType === 'adoption' ? 'Adopción' : 'Retorno'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {transaction.name || transaction.contactName || '—'}
                    </p>
                    {transaction.date ? (
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('es-UY', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Fecha desconocida</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 mt-3">Sin adopciones ni retornos registrados.</p>
          )}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-green-dark">Notas</h2>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Agregar una nota general..."
              aria-label="Nueva nota"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
          {(profile.notes ?? []).length > 0 ? (
            <ul className="flex flex-col gap-2 mt-3">
              {profile.notes!.map((note, index) => (
                <li key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <p className="text-sm text-gray-800">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {note.createdByName ?? note.createdBy} ·{' '}
                    {new Date(note.createdAt).toLocaleString('es-UY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 mt-3">Sin notas por el momento.</p>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
