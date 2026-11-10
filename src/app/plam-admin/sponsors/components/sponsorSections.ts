import { countSponsorSectionBlocks, countSponsorSectionButtons } from '@/lib/sponsorCard';
import { normalizeWhatsAppNumber, resolveSponsorHref } from '@/lib/sponsorLink';
import type {
  SponsorBadgeBlock,
  SponsorBlock,
  SponsorButtonBlock,
  SponsorDescriptionBlock,
  SponsorGroupBlock,
  SponsorLeafBlock,
  SponsorSection,
  SponsorTitleBlock,
  SponsorType,
} from '@/types';

export const MAX_SPONSOR_SECTIONS = 6;
export const MAX_BLOCKS_PER_SECTION = 10;
export const MAX_BUTTON_BLOCKS_PER_SECTION = 4;
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
 * Creates a unique identifier for a text-like block.
 *
 * @returns A block identifier
 */
export const createBlockId = (): string => createId('block');

/**
 * Creates a unique identifier for a button block.
 *
 * @returns A button block identifier
 */
export const createButtonId = (): string => createId('button');

/**
 * Creates a unique identifier for a group block.
 *
 * @returns A group block identifier
 */
export const createGroupId = (): string => createId('group');

/**
 * Creates an empty section with an empty block list.
 *
 * @returns A new empty section
 */
export const createEmptySection = (): SponsorSection => ({
  id: createSectionId(),
  blocks: [],
});

/**
 * Creates an empty title block.
 *
 * @returns A new title block
 */
export const createTitleBlock = (): SponsorTitleBlock => ({
  id: createBlockId(),
  type: 'title',
  text: '',
});

/**
 * Creates an empty badge block.
 *
 * @returns A new badge block
 */
export const createBadgeBlock = (): SponsorBadgeBlock => ({
  id: createBlockId(),
  type: 'badge',
  text: '',
  highlightTone: 'forest',
});

/**
 * Creates an empty description block.
 *
 * @returns A new description block
 */
export const createDescriptionBlock = (): SponsorDescriptionBlock => ({
  id: createBlockId(),
  type: 'description',
  text: '',
  highlightTone: 'none',
});

/**
 * Creates an empty button block.
 *
 * @returns A new button block
 */
export const createButtonBlock = (): SponsorButtonBlock => ({
  id: createButtonId(),
  type: 'button',
  label: '',
  href: '',
  linkType: 'url',
  whatsappNumber: '',
  variant: 'primary',
});

/**
 * Creates an empty group block with the cream background enabled.
 *
 * @returns A new group block
 */
export const createGroupBlock = (): SponsorGroupBlock => ({
  id: createGroupId(),
  type: 'group',
  highlightTone: 'cream',
  blocks: [],
});

/**
 * Clones a block with fresh identifiers so it can be inserted as a new block.
 *
 * @param block - Block to clone
 * @returns A deep copy with new IDs
 */
export const duplicateSponsorBlock = (block: SponsorBlock): SponsorBlock => {
  if (block.type === 'group') {
    return {
      ...block,
      id: createGroupId(),
      blocks: block.blocks.map((child) => ({
        ...child,
        id: child.type === 'button' ? createButtonId() : createBlockId(),
      })),
    };
  }

  if (block.type === 'button') {
    return { ...block, id: createButtonId() };
  }

  return { ...block, id: createBlockId() };
};

/**
 * Clones a section and all of its blocks with fresh identifiers.
 *
 * @param section - Section to clone
 * @returns A deep copy with new IDs
 */
export const duplicateSponsorSection = (section: SponsorSection): SponsorSection => ({
  ...section,
  id: createSectionId(),
  blocks: (section.blocks ?? []).map(duplicateSponsorBlock),
});

const normalizeSponsorLeafBlock = (block: SponsorLeafBlock): SponsorLeafBlock => {
  switch (block.type) {
    case 'title':
    case 'badge':
    case 'description':
      return {
        ...block,
        id: block.id || createBlockId(),
        text: block.text ?? '',
      };
    case 'button':
      return {
        ...block,
        id: block.id || createButtonId(),
        label: block.label ?? '',
        href: block.href ?? '',
        linkType: block.linkType ?? 'url',
        whatsappNumber: block.whatsappNumber ?? '',
        variant: block.variant ?? 'primary',
      };
  }
};

const normalizeSponsorBlock = (block: SponsorBlock): SponsorBlock => {
  if (block.type === 'group') {
    return {
      ...block,
      id: block.id || createGroupId(),
      highlight: block.highlight ?? false,
      blocks: (block.blocks ?? []).map(normalizeSponsorLeafBlock),
    };
  }

  return normalizeSponsorLeafBlock(block);
};

/**
 * Converts the legacy flat fields of a section into ordered blocks.
 *
 * @param section - Legacy section loaded from Firestore
 * @returns Blocks that preserve the previous visual order
 */
const buildBlocksFromLegacySection = (section: SponsorSection): SponsorBlock[] => {
  const title = section.title?.trim();
  const badge = section.badge?.trim();
  const description = section.description?.trim();
  const blocks: SponsorBlock[] = [];

  if (title) {
    blocks.push({ id: createBlockId(), type: 'title', text: title });
  }

  const bodyBlocks: SponsorLeafBlock[] = [];

  if (badge) {
    bodyBlocks.push({ id: createBlockId(), type: 'badge', text: badge });
  }

  if (description) {
    bodyBlocks.push({ id: createBlockId(), type: 'description', text: description });
  }

  for (const button of section.buttons ?? []) {
    bodyBlocks.push({
      ...button,
      id: button.id || createButtonId(),
      type: 'button',
      label: button.label ?? '',
      href: button.href ?? '',
      linkType: button.linkType ?? 'url',
      whatsappNumber: button.whatsappNumber ?? '',
      variant: button.variant ?? 'primary',
    });
  }

  if (bodyBlocks.length > 0) {
    if (section.highlight) {
      blocks.push({
        id: createGroupId(),
        type: 'group',
        highlight: true,
        blocks: bodyBlocks,
      });
    } else {
      blocks.push(...bodyBlocks);
    }
  }

  return blocks;
};

/**
 * Normalizes sections loaded from Firestore so the editor always works with
 * blocks and every section/block has an identifier.
 *
 * @param sections - Sections loaded from Firestore, if any
 * @returns Sections ready to be edited
 */
export const normalizeSponsorSections = (sections?: SponsorSection[]): SponsorSection[] =>
  (sections ?? []).map((section) => {
    const blocks = section.blocks ?? [];
    const hasBlocks = blocks.length > 0;

    return {
      id: section.id || createSectionId(),
      blocks: hasBlocks ? blocks.map(normalizeSponsorBlock) : buildBlocksFromLegacySection(section),
      highlight: hasBlocks ? (section.highlight ?? false) : false,
      highlightTone: hasBlocks ? section.highlightTone : undefined,
    };
  });

/**
 * Converts the legacy sponsor description and main button into a section with
 * blocks so existing cards can be edited with the new block editor.
 *
 * @param sponsor - Sponsor loaded from Firestore
 * @returns A section with the legacy content, or an empty array when there is none
 */
export const buildSectionsFromLegacyContent = (sponsor: SponsorType): SponsorSection[] => {
  const description = sponsor.description?.trim();
  if (!description) return [];

  const href = sponsor.href?.trim();
  const linkLabel = sponsor.linkLabel?.trim() || (href ? 'Ver más' : '');
  const blocks: SponsorBlock[] = [
    {
      id: createGroupId(),
      type: 'group',
      highlight: true,
      blocks: [{ id: createBlockId(), type: 'description', text: description }],
    },
  ];

  if (linkLabel && href) {
    blocks.push({
      id: createButtonId(),
      type: 'button',
      label: linkLabel,
      href,
      linkType: 'url',
      whatsappNumber: '',
      variant: 'primary',
    });
  }

  return [{ id: createSectionId(), blocks }];
};

const cleanSponsorLeafBlock = (block: SponsorLeafBlock): SponsorLeafBlock => {
  switch (block.type) {
    case 'title':
    case 'badge':
    case 'description':
      return {
        ...block,
        text: block.text.trim(),
      };
    case 'button':
      return {
        ...block,
        label: block.label.trim(),
        href: resolveSponsorHref(block),
        linkType: block.linkType ?? 'url',
        whatsappNumber:
          block.linkType === 'whatsapp' ? normalizeWhatsAppNumber(block.whatsappNumber) : '',
        variant: block.variant ?? 'primary',
      };
  }
};

const cleanSponsorBlock = (block: SponsorBlock): SponsorBlock => {
  if (block.type === 'group') {
    return {
      ...block,
      highlight: block.highlight ?? false,
      blocks: block.blocks.map(cleanSponsorLeafBlock),
    };
  }

  return cleanSponsorLeafBlock(block);
};

/**
 * Removes editor-only noise before saving to Firestore: trims text values,
 * resolves link URLs, normalizes WhatsApp numbers and clears legacy fields.
 *
 * @param sections - Sections from the editor state
 * @returns Sections ready to persist
 */
export const cleanSponsorSections = (sections: SponsorSection[]): SponsorSection[] =>
  sections.map((section) => ({
    id: section.id,
    blocks: (section.blocks ?? []).map(cleanSponsorBlock),
    title: '',
    badge: '',
    description: '',
    highlight: section.highlight ?? false,
    highlightTone: section.highlightTone,
    buttons: [],
  }));

const validateSponsorBlocks = (blocks: SponsorBlock[], sectionNumber: number): string | null => {
  for (const block of blocks) {
    switch (block.type) {
      case 'title': {
        const text = block.text.trim();
        if (!text) return `El título de la sección ${sectionNumber} está vacío.`;
        if (text.length > MAX_SECTION_TITLE_LENGTH) {
          return `El título de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_TITLE_LENGTH} caracteres.`;
        }
        break;
      }
      case 'badge': {
        const text = block.text.trim();
        if (!text) return `La etiqueta destacada de la sección ${sectionNumber} está vacía.`;
        if (text.length > MAX_SECTION_BADGE_LENGTH) {
          return `La etiqueta destacada de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_BADGE_LENGTH} caracteres.`;
        }
        break;
      }
      case 'description': {
        const text = block.text.trim();
        if (!text) return `El texto de la sección ${sectionNumber} está vacío.`;
        if (text.length > MAX_SECTION_DESCRIPTION_LENGTH) {
          return `El texto de la sección ${sectionNumber} no puede superar los ${MAX_SECTION_DESCRIPTION_LENGTH} caracteres.`;
        }
        break;
      }
      case 'button': {
        const label = block.label.trim();
        const href = resolveSponsorHref(block);

        if (label.length > MAX_BUTTON_LABEL_LENGTH) {
          return `El texto de los botones de la sección ${sectionNumber} no puede superar los ${MAX_BUTTON_LABEL_LENGTH} caracteres.`;
        }

        if (!label && !href) {
          return `Hay un botón vacío en la sección ${sectionNumber}.`;
        }

        if (label && !href) {
          if (block.linkType === 'whatsapp') {
            return `El botón "${label}" de la sección ${sectionNumber} no tiene número de WhatsApp.`;
          }

          return `El botón "${label}" de la sección ${sectionNumber} no tiene link.`;
        }

        if (!label && href) {
          return `Hay un botón sin texto en la sección ${sectionNumber}.`;
        }
        break;
      }
      case 'group': {
        if (block.blocks.length === 0) {
          return `El grupo de la sección ${sectionNumber} está vacío. Agregá al menos un elemento.`;
        }

        const groupError = validateSponsorBlocks(block.blocks, sectionNumber);
        if (groupError) return groupError;
        break;
      }
    }
  }

  return null;
};

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
    const blocks = section.blocks ?? [];

    if (blocks.length === 0) {
      return `La sección ${sectionNumber} está vacía. Agregá al menos un elemento.`;
    }

    if (countSponsorSectionBlocks(section) > MAX_BLOCKS_PER_SECTION) {
      return `La sección ${sectionNumber} puede tener hasta ${MAX_BLOCKS_PER_SECTION} elementos.`;
    }

    if (countSponsorSectionButtons(section) > MAX_BUTTON_BLOCKS_PER_SECTION) {
      return `La sección ${sectionNumber} puede tener hasta ${MAX_BUTTON_BLOCKS_PER_SECTION} botones.`;
    }

    const blockError = validateSponsorBlocks(blocks, sectionNumber);
    if (blockError) return blockError;
  }

  return null;
};
