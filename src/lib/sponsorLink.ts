import type { SponsorLinkConfig } from '@/types';

/** Fixed country code for Uruguayan phone numbers. */
export const URUGUAY_COUNTRY_CODE = '598';

/**
 * Normalizes a WhatsApp number to digits only, removing the country code
 * prefix if it was pasted and any leading zeros from the local number.
 *
 * @param value - Raw phone number entered by the admin
 * @returns Digits ready to append to the country code
 */
export const normalizeWhatsAppNumber = (value?: string): string => {
  const digits = (value ?? '').replace(/\D/g, '');
  const withoutCountryCode = digits.startsWith(URUGUAY_COUNTRY_CODE)
    ? digits.slice(URUGUAY_COUNTRY_CODE.length)
    : digits;

  return withoutCountryCode.replace(/^0+/, '');
};

/**
 * Builds the WhatsApp URL for a Uruguayan number.
 *
 * @param value - Raw phone number entered by the admin
 * @returns The wa.me URL, including the fixed Uruguayan country code
 */
export const buildWhatsAppHref = (value?: string): string =>
  `https://wa.me/${URUGUAY_COUNTRY_CODE}${normalizeWhatsAppNumber(value)}`;

/**
 * Resolves the effective URL for a sponsor link.
 *
 * @param link - Link fields from a sponsor or section button
 * @returns The generated WhatsApp URL, the trimmed URL, or an empty string
 */
export const resolveSponsorHref = (link: SponsorLinkConfig & { href?: string }): string => {
  if (link.linkType === 'whatsapp') {
    return normalizeWhatsAppNumber(link.whatsappNumber)
      ? buildWhatsAppHref(link.whatsappNumber)
      : '';
  }

  return link.href?.trim() ?? '';
};
