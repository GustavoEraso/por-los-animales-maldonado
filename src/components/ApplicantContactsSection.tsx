'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { logger } from '@/lib/logger';
import {
  confirmApplicantContact,
  discardApplicantContact,
  removeApplicantContact,
  restoreApplicantContact,
  updateApplicantContact,
} from '@/lib/applicants/applicantService';
import {
  getApplicantContactKind,
  getApplicantContactStatus,
  splitPhoneCandidates,
} from '@/lib/applicants/contacts';
import type { ApplicantContact, ApplicantContactKind, ApplicantProfile } from '@/types';

const STATUS_ORDER = {
  pending: 0,
  confirmed: 1,
  discarded: 2,
} as const;

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-700',
  discarded: 'bg-gray-100 text-gray-500',
};

const CONTACT_KIND_LABELS: Record<ApplicantContactKind, string> = {
  celular: 'Celular',
  email: 'Email',
  other: 'Otro',
};

const LABEL_SUGGESTIONS = [
  'Familiar',
  'Pareja',
  'Vecino/a',
  'Veterinario/a',
  'Trabajo',
  'Amigo/a',
  'Rescatista',
];

/** Editable row shown in the contact confirmation modal. */
interface DraftContact {
  value: string;
  kind: ApplicantContactKind;
  label: string;
}

/**
 * Detects explicit separators that usually mean "more than one phone number".
 * The confirmation UI asks staff to use one row per number, so this guard
 * prevents saving a merged/bogus number by mistake.
 */
function looksLikeMultiplePhones(value: string): boolean {
  return /(?:^|\s)(?:y|e|o|u)\s|\/|\\|;|\r|\n|\s{2,}|\s-\s/i.test(value);
}

/**
 * Builds the initial editable values for the confirmation modal. Phone fields
 * receive the candidates suggested by the splitter; staff can correct them,
 * choose the kind and add a label.
 */
function buildDraftValues(contact: ApplicantContact): DraftContact[] {
  if (contact.type === 'email') {
    return [{ value: contact.value.trim(), kind: 'email', label: contact.label ?? '' }];
  }

  const suggestions = splitPhoneCandidates(contact.value).map(
    (candidate) => candidate.normalizedValue
  );
  const values = suggestions.length > 0 ? [...new Set(suggestions)] : [contact.value.trim()];
  return values.map((value) => ({ value, kind: 'celular', label: '' }));
}

interface ApplicantContactsSectionProps {
  /** Profile that owns the contacts. */
  profile: ApplicantProfile;
  /** Confirmed contacts that also belong to other profiles, keyed by type:value. */
  contactConflicts: Record<string, { applicantId: string; name: string }[]>;
  /** Whether the current user can review/remove contacts. */
  isAdmin: boolean;
  /** Called with the updated list after every mutation. */
  onContactsChanged: (contacts: ApplicantContact[]) => void;
  /** Opens the manual contact form (admin only). */
  onAddContact?: () => void;
}

/**
 * Contacts section of the applicant ficha.
 *
 * Contacts extracted from a form start as `pending`: they are shown exactly as
 * the applicant wrote them and are not indexed. Staff confirms, corrects or
 * discards them; only confirmed contacts are normalized and used to detect
 * coincidences with other profiles.
 *
 * @example
 * <ApplicantContactsSection
 *   profile={profile}
 *   contactConflicts={contactConflicts}
 *   isAdmin={isAdmin}
 *   onContactsChanged={(contacts) => setProfile((prev) => prev && { ...prev, contacts })}
 * />
 */
export default function ApplicantContactsSection({
  profile,
  contactConflicts,
  isAdmin,
  onContactsChanged,
  onAddContact,
}: ApplicantContactsSectionProps) {
  const { currentUser } = useAuth();
  const [reviewing, setReviewing] = useState<ApplicantContact | null>(null);
  const [draftValues, setDraftValues] = useState<DraftContact[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ApplicantContact | null>(null);
  const [editKind, setEditKind] = useState<ApplicantContactKind>('celular');
  const [editLabel, setEditLabel] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const contacts = profile.contacts ?? [];
  const pendingCount = contacts.filter(
    (contact) => getApplicantContactStatus(contact) === 'pending'
  ).length;

  const sortedContacts = [...contacts].sort((first, second) => {
    const firstStatus = getApplicantContactStatus(first);
    const secondStatus = getApplicantContactStatus(second);
    return STATUS_ORDER[firstStatus] - STATUS_ORDER[secondStatus];
  });

  const openReview = (contact: ApplicantContact): void => {
    setReviewing(contact);
    setDraftValues(buildDraftValues(contact));
    setError(null);
  };

  const closeReview = (): void => {
    if (saving) return;
    setReviewing(null);
    setDraftValues([]);
    setError(null);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!reviewing || !currentUser) return;

    const values = draftValues
      .map((draft) => ({ ...draft, value: draft.value.trim() }))
      .filter((draft) => draft.value.length > 0);

    if (values.length === 0) {
      setError('Ingresá al menos un valor para confirmar.');
      return;
    }
    if (values.some((draft) => draft.kind === 'celular' && looksLikeMultiplePhones(draft.value))) {
      setError('Parece haber más de un número en un mismo campo. Usá una fila por número.');
      return;
    }

    setSaving(true);
    setError(null);

    const promise = confirmApplicantContact({
      profile,
      pendingContact: reviewing,
      values: values.map((draft) => ({
        value: draft.value,
        kind: draft.kind,
        label: draft.label,
      })),
      actor: { id: currentUser.id, name: currentUser.name },
    });

    try {
      const result = await handlePromiseToast(promise, {
        messages: {
          pending: { title: 'Confirmando contacto...', text: '' },
          success: {
            title: 'Contacto confirmado',
            text: 'El contacto quedó confirmado. Los de tipo Otro son solo visibles.',
          },
          error: { title: 'Error', text: 'No se pudo confirmar el contacto.' },
        },
      });

      onContactsChanged(result.contacts);
      setReviewing(null);
      setDraftValues([]);

      if (result.conflicts.length > 0) {
        handleToast({
          type: 'warning',
          title: 'Contacto compartido',
          text: 'El contacto confirmado también está en otra ficha. Revisá la coincidencia.',
        });
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'No se pudo confirmar el contacto.';
      setError(message);
      logger({
        level: 'error',
        code: 'CONFIRM_APPLICANT_CONTACT_FAILED',
        message: 'Could not confirm applicant contact',
        data: caughtError,
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (contact: ApplicantContact): void => {
    setEditingContact(contact);
    setEditKind(getApplicantContactKind(contact));
    setEditLabel(contact.label ?? '');
    setEditValue(contact.value);
    setEditError(null);
  };

  const closeEdit = (): void => {
    if (savingEdit) return;
    setEditingContact(null);
    setEditError(null);
  };

  const handleEditSave = async (): Promise<void> => {
    if (!editingContact || !currentUser) return;

    const value = editValue.trim();
    if (!value) {
      setEditError('Ingresá un valor para el contacto.');
      return;
    }
    if (editKind === 'celular' && looksLikeMultiplePhones(value)) {
      setEditError('Parece haber más de un número. Usá una fila por número.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    const promise = updateApplicantContact({
      profile,
      contact: editingContact,
      kind: editKind,
      rawValue: value,
      label: editLabel,
      actor: { id: currentUser.id, name: currentUser.name },
    });

    try {
      const nextContacts = await handlePromiseToast(promise, {
        messages: {
          pending: { title: 'Guardando contacto...', text: '' },
          success: {
            title: 'Contacto actualizado',
            text: 'Los cambios se guardaron correctamente.',
          },
          error: { title: 'Error', text: 'No se pudo actualizar el contacto.' },
        },
      });
      onContactsChanged(nextContacts);
      setEditingContact(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'No se pudo actualizar el contacto.';
      setEditError(message);
      logger({
        level: 'error',
        code: 'UPDATE_APPLICANT_CONTACT_FAILED',
        message: 'Could not update applicant contact',
        data: caughtError,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDiscard = async (contact: ApplicantContact): Promise<void> => {
    if (!currentUser) return;
    try {
      const nextContacts = await handlePromiseToast(
        discardApplicantContact({
          profile,
          contact,
          actor: { id: currentUser.id, name: currentUser.name },
        }),
        {
          messages: {
            pending: { title: 'Descartando contacto...', text: '' },
            success: { title: 'Contacto descartado', text: 'No se usará para coincidencias.' },
            error: { title: 'Error', text: 'No se pudo descartar el contacto.' },
          },
        }
      );
      onContactsChanged(nextContacts);
    } catch (caughtError) {
      logger({
        level: 'error',
        code: 'DISCARD_APPLICANT_CONTACT_FAILED',
        message: 'Could not discard applicant contact',
        data: caughtError,
      });
    }
  };

  const handleRestore = async (contact: ApplicantContact): Promise<void> => {
    if (!currentUser) return;
    try {
      const nextContacts = await handlePromiseToast(
        restoreApplicantContact({
          profile,
          contact,
          actor: { id: currentUser.id, name: currentUser.name },
        }),
        {
          messages: {
            pending: { title: 'Restaurando contacto...', text: '' },
            success: { title: 'Contacto restaurado', text: 'Volvió a la lista de pendientes.' },
            error: { title: 'Error', text: 'No se pudo restaurar el contacto.' },
          },
        }
      );
      onContactsChanged(nextContacts);
    } catch (caughtError) {
      logger({
        level: 'error',
        code: 'RESTORE_APPLICANT_CONTACT_FAILED',
        message: 'Could not restore applicant contact',
        data: caughtError,
      });
    }
  };

  const handleRemove = async (contact: ApplicantContact): Promise<void> => {
    if (!currentUser) return;
    try {
      const nextContacts = await handlePromiseToast(
        removeApplicantContact({
          profile,
          contact,
          actor: { id: currentUser.id, name: currentUser.name },
        }),
        {
          messages: {
            pending: { title: 'Quitando contacto...', text: '' },
            success: { title: 'Contacto quitado', text: 'Se eliminó de la ficha.' },
            error: { title: 'Error', text: 'No se pudo quitar el contacto.' },
          },
        }
      );
      onContactsChanged(nextContacts);
    } catch (caughtError) {
      logger({
        level: 'error',
        code: 'REMOVE_APPLICANT_CONTACT_FAILED',
        message: 'Could not remove applicant contact',
        data: caughtError,
      });
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-bold text-green-dark">Contactos</h2>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
            {pendingCount} sin confirmar
          </span>
        )}
        {isAdmin && onAddContact && (
          <button
            type="button"
            onClick={onAddContact}
            className="ml-auto px-3 py-1.5 rounded-lg bg-green-forest hover:bg-green-dark text-xs font-semibold text-white"
          >
            + Agregar contacto
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        El email automático de Google se confirma solo. Los contactos Celular se indexan al
        confirmarlos; los de tipo Otro son solo visibles.
      </p>

      {sortedContacts.length > 0 ? (
        <ul className="flex flex-col gap-2 mt-3">
          {sortedContacts.map((contact, index) => {
            // The automatic Google email is the identity anchor: always
            // confirmed and never removable. Phones (and legacy user-typed
            // emails) go through human review.
            const isProtected = contact.labels?.includes('googleAccountEmail') ?? false;
            const status = isProtected ? 'confirmed' : getApplicantContactStatus(contact);
            const kind = getApplicantContactKind(contact);
            const conflicts =
              status === 'confirmed' && kind !== 'other' && contact.normalizedValue
                ? (contactConflicts[`${contact.type}:${contact.normalizedValue}`] ?? [])
                : [];

            return (
              <li
                key={`${contact.type}-${contact.value}-${status}-${index}`}
                className="bg-gray-50 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {CONTACT_KIND_LABELS[kind]}
                  </span>
                  {contact.label && (
                    <span className="text-sm font-semibold text-gray-800">{contact.label}</span>
                  )}
                  <span
                    className={`text-sm ${status === 'discarded' ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                  >
                    {contact.value}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[status]}`}
                  >
                    {status === 'pending'
                      ? 'Sin confirmar'
                      : status === 'confirmed'
                        ? 'Confirmado'
                        : 'Descartado'}
                  </span>
                </div>

                {status === 'confirmed' &&
                  kind !== 'other' &&
                  contact.normalizedValue &&
                  contact.normalizedValue !== contact.value && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Normalizado: {contact.normalizedValue}
                    </p>
                  )}

                {conflicts.length > 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    ⚠ También está en{' '}
                    {conflicts.map((other, otherIndex) => (
                      <span key={other.applicantId}>
                        {otherIndex > 0 ? ', ' : ''}
                        <Link
                          href={`/plam-admin/postulantes/${other.applicantId}`}
                          className="underline hover:text-amber-900"
                        >
                          {other.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  Visto en {contact.sourceFormIds.length}{' '}
                  {contact.sourceFormIds.length === 1 ? 'formulario' : 'formularios'}
                  {contact.labels?.includes('manual') ? ' · agregado manualmente' : ''}
                  {contact.labels?.includes('transaction') ? ' · desde adopción/retorno' : ''}
                </p>

                {isAdmin && !isProtected && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {status === 'pending' && (
                      <>
                        {contact.type === 'phone' && (
                          <button
                            type="button"
                            onClick={() => openReview(contact)}
                            className="px-3 py-1.5 rounded-lg bg-green-forest hover:bg-green-dark text-xs font-semibold text-white"
                          >
                            Revisar y confirmar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDiscard(contact)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                        >
                          Descartar
                        </button>
                      </>
                    )}
                    {status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(contact)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(contact)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                        >
                          Quitar
                        </button>
                      </>
                    )}
                    {status === 'discarded' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestore(contact)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                        >
                          Restaurar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(contact)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                        >
                          Quitar
                        </button>
                      </>
                    )}
                  </div>
                )}
                {isProtected && (
                  <p className="text-xs text-gray-400 mt-2">
                    Email automático de Google: siempre confirmado y no se puede quitar.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 mt-3">Sin contactos registrados.</p>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-green-dark">Confirmar contacto</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">El postulante escribió:</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-1">
                {reviewing.value}
              </p>
            </div>

            <datalist id="applicant-contact-label-suggestions">
              {LABEL_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>

            <p className="text-xs text-gray-500">
              Revisá los datos. Elegí Celular u Otro, agregá una etiqueta si hace falta (ej. Pareja)
              y usá una fila por número.
            </p>

            <div className="flex flex-col gap-2">
              {draftValues.map((draft, index) => (
                <div
                  key={`draft-${index}`}
                  className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2"
                >
                  <select
                    value={draft.kind}
                    onChange={(event) =>
                      setDraftValues((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, kind: event.target.value as ApplicantContactKind }
                            : entry
                        )
                      )
                    }
                    aria-label={`Tipo ${index + 1}`}
                    className="px-2 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="celular">Celular</option>
                    <option value="other">Otro</option>
                  </select>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(event) =>
                      setDraftValues((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, label: event.target.value } : entry
                        )
                      )
                    }
                    list="applicant-contact-label-suggestions"
                    placeholder="Etiqueta"
                    aria-label={`Etiqueta ${index + 1}`}
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type={
                      draft.kind === 'email' ? 'email' : draft.kind === 'celular' ? 'tel' : 'text'
                    }
                    value={draft.value}
                    onChange={(event) =>
                      setDraftValues((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, value: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Valor del contacto"
                    aria-label={`Valor ${index + 1}`}
                    className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  {draftValues.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftValues((current) =>
                          current.filter((_, entryIndex) => entryIndex !== index)
                        )
                      }
                      className="px-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
                      aria-label={`Quitar valor ${index + 1}`}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setDraftValues((current) => [...current, { value: '', kind: 'celular', label: '' }])
              }
              className="self-start px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
            >
              Agregar otro
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReview}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-green-dark">Editar contacto</h2>

            <div className="flex flex-col gap-2">
              <select
                value={editKind}
                onChange={(event) => {
                  const nextKind = event.target.value;
                  if (nextKind === 'celular' || nextKind === 'email' || nextKind === 'other') {
                    setEditKind(nextKind);
                  }
                }}
                aria-label="Tipo de contacto"
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="celular">Celular</option>
                <option value="email">Email</option>
                <option value="other">Otro</option>
              </select>
              <input
                type="text"
                value={editLabel}
                onChange={(event) => setEditLabel(event.target.value)}
                list="applicant-contact-label-suggestions-edit"
                placeholder="Etiqueta (opcional, ej. Pareja)"
                aria-label="Etiqueta del contacto"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <datalist id="applicant-contact-label-suggestions-edit">
                {LABEL_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <input
                type={editKind === 'email' ? 'email' : editKind === 'celular' ? 'tel' : 'text'}
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                placeholder="Valor del contacto"
                aria-label="Valor del contacto"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-xs text-gray-500">
                Los contactos de tipo Otro son solo visibles: no se usan para coincidencias.
              </p>
            </div>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-green-forest hover:bg-green-dark text-sm font-semibold text-white disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
