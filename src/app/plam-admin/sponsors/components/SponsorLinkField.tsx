'use client';

import { buildWhatsAppHref, normalizeWhatsAppNumber } from '@/lib/sponsorLink';

interface SponsorLinkFieldValues {
  href: string;
  linkType: 'url' | 'whatsapp';
  whatsappNumber: string;
}

interface SponsorLinkFieldProps {
  /** Unique prefix used to build accessible input IDs. */
  idPrefix: string;
  /** Visible label for the link field. */
  label: string;
  /** Current URL value. */
  href: string;
  /** Current link mode. Defaults to URL. */
  linkType?: 'url' | 'whatsapp';
  /** Current Uruguayan phone number. */
  whatsappNumber?: string;
  /** Called with the complete link state after every change. */
  onChange: (values: SponsorLinkFieldValues) => void;
  /** Optional helper text shown below the field. */
  helperText?: string;
}

/**
 * Link editor that supports regular URLs and WhatsApp numbers.
 *
 * In WhatsApp mode the admin only types the Uruguayan phone number and the
 * `wa.me` URL is generated automatically with the fixed +598 country code.
 *
 * @param props - Current link values and change callback
 * @returns The link editor UI
 */
export default function SponsorLinkField({
  idPrefix,
  label,
  href,
  linkType,
  whatsappNumber,
  onChange,
  helperText,
}: SponsorLinkFieldProps): React.ReactElement {
  const type = linkType ?? 'url';
  const number = whatsappNumber ?? '';
  const normalizedNumber = normalizeWhatsAppNumber(number);
  const generatedHref = buildWhatsAppHref(number);

  const handleTypeChange = (nextType: 'url' | 'whatsapp'): void => {
    onChange({
      href: nextType === 'whatsapp' && normalizedNumber ? generatedHref : href,
      linkType: nextType,
      whatsappNumber: number,
    });
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextNumber = event.target.value;
    const hasNumber = Boolean(normalizeWhatsAppNumber(nextNumber));

    onChange({
      href: hasNumber ? buildWhatsAppHref(nextNumber) : '',
      linkType: 'whatsapp',
      whatsappNumber: nextNumber,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div
          role="group"
          aria-label={`Tipo de link para ${label}`}
          className="flex rounded-lg overflow-hidden border border-gray-200"
        >
          <button
            type="button"
            aria-pressed={type === 'url'}
            onClick={() => handleTypeChange('url')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              type === 'url'
                ? 'bg-green-forest text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            URL
          </button>
          <button
            type="button"
            aria-pressed={type === 'whatsapp'}
            onClick={() => handleTypeChange('whatsapp')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              type === 'whatsapp'
                ? 'bg-green-forest text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>

      {type === 'url' ? (
        <input
          id={`${idPrefix}-url`}
          type="url"
          value={href}
          onChange={(event) =>
            onChange({
              href: event.target.value,
              linkType: 'url',
              whatsappNumber: number,
            })
          }
          aria-label={label}
          placeholder="https://..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
        />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-whatsapp`} className="text-xs font-semibold text-gray-700">
              Número de WhatsApp
            </label>
            <div className="flex items-stretch">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                +598
              </span>
              <input
                id={`${idPrefix}-whatsapp`}
                type="tel"
                inputMode="tel"
                value={number}
                onChange={handleNumberChange}
                placeholder="99 123 456"
                className="w-full rounded-r-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-forest"
              />
            </div>
            <p className="text-xs text-gray-500">
              Solo el número uruguayo, sin 0 inicial ni código de país.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${idPrefix}-whatsapp-preview`}
              className="text-xs font-semibold text-gray-700"
            >
              Link generado
            </label>
            <input
              id={`${idPrefix}-whatsapp-preview`}
              type="url"
              readOnly
              value={generatedHref}
              aria-label="Link de WhatsApp generado"
              className="border border-gray-200 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
            {!normalizedNumber && (
              <p className="text-xs text-gray-400">Se completa al ingresar el número.</p>
            )}
          </div>
        </>
      )}

      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
