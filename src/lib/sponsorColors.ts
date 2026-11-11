import type { SponsorHighlightTone } from '@/types';

/** Option displayed in the admin color picker. */
export interface SponsorHighlightOption {
  value: SponsorHighlightTone;
  label: string;
  swatchClass: string;
}

/** Available background tones for sections, groups and text blocks. */
export const SPONSOR_HIGHLIGHT_OPTIONS: SponsorHighlightOption[] = [
  { value: 'none', label: 'Sin fondo', swatchClass: 'bg-white border-dashed' },
  { value: 'cream', label: 'Crema', swatchClass: 'bg-cream-light' },
  { value: 'amber', label: 'Ámbar', swatchClass: 'bg-amber-sunset' },
  { value: 'caramel', label: 'Caramelo', swatchClass: 'bg-caramel-deep' },
  { value: 'forest', label: 'Bosque', swatchClass: 'bg-green-forest' },
  { value: 'dark', label: 'Oscuro', swatchClass: 'bg-green-dark' },
];

/** Static Tailwind classes for each background tone, including readable text colors. */
export const SPONSOR_HIGHLIGHT_WRAPPER_CLASSES: Record<
  Exclude<SponsorHighlightTone, 'none'>,
  string
> = {
  cream: 'bg-cream-light text-green-dark',
  amber: 'bg-amber-sunset text-green-dark',
  caramel: 'bg-caramel-deep text-white',
  forest: 'bg-green-forest text-white',
  dark: 'bg-green-dark text-cream-light',
};

/**
 * Resolves the active background tone.
 *
 * @param tone - Stored tone for the section, group or text block
 * @param legacyHighlight - Legacy cream boolean used when no tone is stored
 * @returns The active tone, or null when there is no background
 */
export const resolveSponsorHighlightTone = (
  tone?: SponsorHighlightTone,
  legacyHighlight?: boolean
): Exclude<SponsorHighlightTone, 'none'> | null => {
  if (tone) return tone === 'none' ? null : tone;
  return legacyHighlight ? 'cream' : null;
};
