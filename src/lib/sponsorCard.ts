import { resolveSponsorHref } from '@/lib/sponsorLink';
import type { SponsorBlock, SponsorButton, SponsorSection, SponsorType } from '@/types';

/**
 * Returns the buttons of a legacy section that have both a label and a link.
 * Values are trimmed so they can be rendered safely.
 *
 * @param section - Legacy section whose buttons should be resolved
 * @returns Valid buttons ready to render
 */
export const getSponsorSectionButtons = (section: SponsorSection): SponsorButton[] =>
  (section.buttons ?? [])
    .map((button) => ({
      ...button,
      label: button.label.trim(),
      href: resolveSponsorHref(button),
    }))
    .filter((button) => Boolean(button.label && button.href));

/**
 * Returns true when a block has visible content.
 *
 * @param block - Block to evaluate
 * @returns Whether the block should be rendered
 */
export const hasSponsorBlockContent = (block: SponsorBlock): boolean => {
  switch (block.type) {
    case 'title':
    case 'badge':
    case 'description':
      return Boolean(block.text.trim());
    case 'button':
      return Boolean(block.label.trim() && resolveSponsorHref(block));
    case 'group':
      return block.blocks.some(hasSponsorBlockContent);
  }
};

/**
 * Counts the content blocks contributed by a single block. Group containers
 * count as one item plus their nested blocks.
 *
 * @param block - Block to count
 * @returns Number of content blocks contributed
 */
export const countSponsorBlockItems = (block: SponsorBlock): number =>
  block.type === 'group' ? 1 + block.blocks.length : 1;

/**
 * Counts the content blocks of a section, including group containers and the
 * blocks nested inside them.
 *
 * @param section - Section to count
 * @returns Number of content blocks
 */
export const countSponsorSectionBlocks = (section: SponsorSection): number =>
  (section.blocks ?? []).reduce((total, block) => total + countSponsorBlockItems(block), 0);

/**
 * Counts the button blocks of a section, including buttons nested in groups.
 *
 * @param section - Section to count
 * @returns Number of button blocks
 */
export const countSponsorSectionButtons = (section: SponsorSection): number =>
  (section.blocks ?? []).reduce((total, block) => {
    if (block.type === 'button') return total + 1;
    if (block.type === 'group') {
      return total + block.blocks.filter((child) => child.type === 'button').length;
    }
    return total;
  }, 0);

/**
 * Returns true when a section has visible content.
 *
 * @param section - Section to evaluate
 * @returns Whether the section has anything to render
 */
export const hasSponsorSectionContent = (section: SponsorSection): boolean => {
  if (section.blocks && section.blocks.length > 0) {
    return section.blocks.some(hasSponsorBlockContent);
  }

  return Boolean(
    section.title?.trim() ||
      section.badge?.trim() ||
      section.description?.trim() ||
      getSponsorSectionButtons(section).length > 0
  );
};

/**
 * Returns true when the sponsor should render a collaborator card on the
 * donations page. A card is rendered when it has a legacy description or at
 * least one section with visible content.
 *
 * @param sponsor - Sponsor to evaluate
 * @returns Whether the sponsor has card content
 */
export const hasSponsorCardContent = (sponsor: SponsorType): boolean =>
  Boolean(sponsor.description?.trim() || (sponsor.sections ?? []).some(hasSponsorSectionContent));

/**
 * Returns whether the sponsor is explicitly enabled for the donations page.
 * Sponsors without the flag keep the legacy behavior based on their content.
 *
 * @param sponsor - Sponsor to evaluate
 * @returns Whether the sponsor can be shown in donations
 */
export const isSponsorShownInDonations = (sponsor: SponsorType): boolean =>
  sponsor.showInDonations ?? hasSponsorCardContent(sponsor);
