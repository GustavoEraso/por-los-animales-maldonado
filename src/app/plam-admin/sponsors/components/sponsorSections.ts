import { SponsorButton, SponsorSection, SponsorType } from '@/types';
import { resolveSponsorHref, normalizeWhatsAppNumber } from '@/lib/sponsorLink';

export const MAX_SPONSOR_SECTIONS = 6;
export const MAX_BUTTONS_PER_SECTION = 3;
export const MAX_SECTION_TITLE_LENGTH = 80;
export const MAX_SECTION_BADGE_LENGTH = 60;
export const MAX_SECTION_DESCRIPTION_LENGTH = 600;
export const MAX_BUTTON_LABEL_LENGTH = 40;

const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Creates a unique identifier for a card section.
 *
 * @returns A section identifier
 */
export const createSectionId = (): string => createId('section');

/**
 * Creates a unique identifier for a section button.
 *
 * @returns A button identifier
 */
export const createButtonId = (): string => createId('button');

/**
 * Creates an empty section with the default editor values.
 *
 * @returns A new empty section
 */
export const createEmptySection = (): SponsorSection => ({
  id: createSectionId(),
  title: '',
  badge: '',
  description: '',
  highlight: false,
  buttons: [],
});

/**
 * Converts the legacy sponsor description and main button into sections so
 * existing cards can be edited with the new section-based editor.
 *
 * @param sponsor - Sponsor loaded from Firestore
 * @returns A section with the legacy content, or an empty array when there is none
 */
export const buildSectionsFromLegacyContent = (sponsor: SponsorType): SponsorSection[] => {
  const description = sponsor.description?.trim();
  if (!description) return [];

  const href = sponsor.href?.trim();
  const linkLabel = sponsor.linkLabel?.trim() || (href ? 'Ver más' : '');
  const canCreateButton = Boolean(linkLabel && href);

  const buttons: SponsorButton[] = canCreateButton
    ? [{ id: createButtonId(), label: linkLabel, href: href ?? '', variant: 'primary' }]
    : [];

  return [
    {
      id: createSectionId(),
      title: '',
      description,
      highlight: true,
      buttons,
    },
  ];
};

/**
 * Normalizes sections loaded from Firestore so the editor always works with
 * concrete values and every section/button has an identifier.
 *
 * @param sections - Sections loaded from Firestore, if any
 * @returns Sections ready to be edited
 */
export const normalizeSponsorSections = (sections?: SponsorSection[]): SponsorSection[] =>
  (sections ?? []).map((section) => ({
    ...section,
    id: section.id || createSectionId(),
    title: section.title ?? '',
    badge: section.badge ?? '',
    description: section.description ?? '',
    highlight: section.highlight ?? false,
    buttons: (section.buttons ?? []).map((button) => ({
      ...button,
      id: button.id || createButtonId(),
      label: button.label ?? '',
      href: button.href ?? '',
      variant: button.variant ?? 'primary',
    })),
  }));

/**
 * Removes editor-only noise before saving to Firestore: trims values, drops
 * completely empty buttons and ensures every section has its base fields.
 *
 * @param sections - Sections from the editor state
 * @returns Sections ready to persist
 */
export const cleanSponsorSections = (sections: SponsorSection[]): SponsorSection[] =>
  sections.map((section) => ({
    id: section.id,
    title: section.title?.trim() ?? '',
    badge: section.badge?.trim() ?? '',
    description: section.description?.trim() ?? '',
    highlight: section.highlight ?? false,
    buttons: (section.buttons ?? [])
      .filter((button) => button.label.trim() || resolveSponsorHref(button))
      .map((button) => ({
        id: button.id,
        label: button.label.trim(),
        href: resolveSponsorHref(button),
        linkType: button.linkType ?? 'url',
        whatsappNumber:
          button.linkType === 'whatsapp' ? normalizeWhatsAppNumber(button.whatsappNumber) : '',
        variant: button.variant ?? 'primary',
      })),
  }));

const hasRawSectionContent = (section: SponsorSection): boolean =>
  Boolean(
    section.title?.trim() ||
      section.badge?.trim() ||
      section.description?.trim() ||
      (section.buttons ?? []).some((button) => button.label.trim() || resolveSponsorHref(button))
  );

/**
 * Validates the sections before saving.
 *
 * @param sections - Sections from the editor state
 * @returns A user-facing error message, or null when the sections are valid
 */
export const validateSponsorSections = (sections: SponsorSection[]): string | null => {
  if (sections.length > MAX_SPONSOR_SECTIONS) {
    return `Podés agregar hasta ${MAX_SPONSOR_SECTIONS} secciones.`;
  }

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const sectionNumber = index + 1;

    if (!hasRawSectionContent(section)) {
      return `La sección ${sectionNumber} está vacía. Completala o eliminála.`;
    }

    if ((section.title?.trim().length ?? 0) > MAX_SECTION_TITLE_LENGTH) {
      return `El título de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_TITLE_LENGTH} caracteres.`;
    }

    if ((section.badge?.trim().length ?? 0) > MAX_SECTION_BADGE_LENGTH) {
      return `La etiqueta destacada de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_BADGE_LENGTH} caracteres.`;
    }

    if ((section.description?.trim().length ?? 0) > MAX_SECTION_DESCRIPTION_LENGTH) {
      return `La descripción de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_DESCRIPTION_LENGTH} caracteres.`;
    }

    const buttons = section.buttons ?? [];
    if (buttons.length > MAX_BUTTONS_PER_SECTION) {
      return `La sección ${sectionNumber} puede tener hasta ${MAX_BUTTONS_PER_SECTION} botones.`;
    }

    for (const button of buttons) {
      const label = button.label.trim();
      const href = resolveSponsorHref(button);

      if (label.length > MAX_BUTTON_LABEL_LENGTH) {
        return `El texto de los botones de la sección ${sectionNumber} no puede superar los ${MAX_BUTTON_LABEL_LENGTH} caracteres.`;
      }

      if (label && !href) {
        if (button.linkType === 'whatsapp') {
          return `El botón "${label}" de la sección ${sectionNumber} no tiene número de WhatsApp.`;
        }

        return `El botón "${label}" de la sección ${sectionNumber} no tiene link.`;
      }

      if (!label && href) {
        return `Hay un botón sin texto en la sección ${sectionNumber}.`;
      }
    }
  }

  return null;
};
