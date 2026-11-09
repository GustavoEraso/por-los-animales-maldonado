import { SponsorButton, SponsorSection, SponsorType } from '@/types';

/**
 * Returns the buttons of a section that have both a label and a link.
 * Values are trimmed so they can be rendered safely.
 *
 * @param section - Section whose buttons should be resolved
 * @returns Valid buttons ready to render
 */
export const getSponsorSectionButtons = (section: SponsorSection): SponsorButton[] =>
  (section.buttons ?? [])
    .map((button) => ({
      ...button,
      label: button.label.trim(),
      href: button.href.trim(),
    }))
    .filter((button) => Boolean(button.label && button.href));

/**
 * Returns true when a section has a title, badge, description or at least one
 * complete button.
 *
 * @param section - Section to evaluate
 * @returns Whether the section has visible content
 */
export const hasSponsorSectionContent = (section: SponsorSection): boolean =>
  Boolean(
    section.title?.trim() ||
      section.badge?.trim() ||
      section.description?.trim() ||
      getSponsorSectionButtons(section).length > 0
  );

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
