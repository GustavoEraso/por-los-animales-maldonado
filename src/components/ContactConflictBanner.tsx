'use client';

import type { SharedContact } from '@/types';

interface ContactConflictBannerProps {
  /** Contacts of the form that also belong to other applicant profiles. */
  sharedContacts?: SharedContact[];
}

/**
 * Legacy warning banner shown in the form detail when one or more of the
 * submitted contacts already belong to another applicant profile.
 *
 * The current pipeline does not produce `sharedContacts` anymore: only the
 * automatic Google email is used and a shared one leaves the form unresolved.
 * This component is kept so old forms with legacy data still render safely.
 *
 * @example
 * <ContactConflictBanner sharedContacts={form.identityResolution?.sharedContacts} />
 */
export default function ContactConflictBanner({ sharedContacts }: ContactConflictBannerProps) {
  const emailContacts = (sharedContacts ?? []).filter((contact) => contact.type === 'email');
  if (emailContacts.length === 0) return null;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3">
      <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
        ⚠
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-amber-800">
          Contacto en más de un postulante — revisar
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Estos contactos del formulario también pertenecen a otra ficha. No se fusionó nada.
        </p>
        <ul className="flex flex-col gap-0.5 mt-1">
          {emailContacts.map((contact) => (
            <li key={`${contact.type}:${contact.value}`} className="text-xs text-amber-800">
              <span className="font-semibold">
                {contact.type === 'email' ? 'Email' : 'Teléfono'}:
              </span>{' '}
              {contact.value} · {contact.applicantIds.length} postulantes
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
