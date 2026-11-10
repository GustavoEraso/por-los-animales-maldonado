import Image from 'next/image';
import SmartLink from '@/lib/SmartLink';
import {
  getSponsorSectionButtons,
  hasSponsorBlockContent,
  hasSponsorSectionContent,
} from '@/lib/sponsorCard';
import {
  SPONSOR_HIGHLIGHT_WRAPPER_CLASSES,
  resolveSponsorHighlightTone,
} from '@/lib/sponsorColors';
import { resolveSponsorHref } from '@/lib/sponsorLink';
import { SponsorBlock, SponsorButtonBlock, SponsorSection, SponsorType } from '@/types';

interface SponsorCardProps {
  /** Sponsor to render as a collaborator card. */
  sponsor: SponsorType;
  /**
   * Enables placeholder content for the admin preview.
   * When disabled, the card renders nothing if the sponsor has no content.
   */
  preview?: boolean;
}

interface SponsorCardSectionProps {
  section: SponsorSection;
  sponsorName: string;
}

interface SponsorCardBlockProps {
  block: SponsorBlock;
  sponsorName: string;
}

/**
 * Renders a single content block inside a collaborator card.
 *
 * @param props - Block content and sponsor name used for accessible labels
 * @returns The block content, or null when there is nothing to render
 */
function SponsorCardBlock({
  block,
  sponsorName,
}: SponsorCardBlockProps): React.ReactElement | null {
  switch (block.type) {
    case 'title': {
      const text = block.text.trim();
      if (!text) return null;

      return <h5 className="text-lg font-bold text-center text-balance">{text}</h5>;
    }
    case 'badge': {
      const text = block.text.trim();
      if (!text) return null;

      const tone = block.highlightTone ?? 'forest';
      if (tone === 'none') {
        return (
          <mark className="inline-flex max-w-full items-center justify-center bg-transparent text-center text-lg font-extrabold uppercase leading-tight text-balance sm:text-xl">
            {text}
          </mark>
        );
      }

      return (
        <mark
          className={`inline-flex max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-lg font-extrabold uppercase leading-tight text-balance sm:text-xl ${SPONSOR_HIGHLIGHT_WRAPPER_CLASSES[tone]}`}
        >
          {text}
        </mark>
      );
    }
    case 'description': {
      const text = block.text.trim();
      if (!text) return null;

      const tone = resolveSponsorHighlightTone(block.highlightTone, block.highlight);
      const toneClass = tone ? `rounded-lg p-4 ${SPONSOR_HIGHLIGHT_WRAPPER_CLASSES[tone]}` : '';

      return (
        <div className={`w-full ${toneClass}`}>
          <p className="text-base leading-relaxed whitespace-pre-line text-center">{text}</p>
        </div>
      );
    }
    case 'button': {
      const label = block.label.trim();
      const href = resolveSponsorHref(block);
      if (!label || !href) return null;

      return (
        <SmartLink
          href={href}
          variant={block.variant === 'secondary' ? 'secondary' : 'primary'}
          aria-label={`${label} - ${sponsorName}`}
        >
          {label}
        </SmartLink>
      );
    }
    case 'group': {
      if (!block.blocks.some(hasSponsorBlockContent)) return null;

      const tone = resolveSponsorHighlightTone(block.highlightTone, block.highlight);
      const toneClass = tone ? `rounded-lg p-4 ${SPONSOR_HIGHLIGHT_WRAPPER_CLASSES[tone]}` : '';

      return (
        <div className={`w-full flex flex-col items-center gap-3 ${toneClass}`}>
          <SponsorCardBlocks blocks={block.blocks} sponsorName={sponsorName} />
        </div>
      );
    }
  }
}

interface SponsorCardBlocksProps {
  blocks: SponsorBlock[];
  sponsorName: string;
}

/**
 * Renders a block list, grouping consecutive buttons into a single row.
 *
 * @param props - Blocks to render and sponsor name used for accessible labels
 * @returns The rendered blocks
 */
function SponsorCardBlocks({ blocks, sponsorName }: SponsorCardBlocksProps): React.ReactElement {
  const renderedBlocks: React.ReactElement[] = [];
  let buttonRun: SponsorButtonBlock[] = [];

  const flushButtons = (): void => {
    if (buttonRun.length === 0) return;

    const currentRun = [...buttonRun];
    buttonRun = [];
    renderedBlocks.push(
      <div key={`buttons-${currentRun[0].id}`} className="flex flex-wrap justify-center gap-3">
        {currentRun.map((button) => (
          <SponsorCardBlock key={button.id} block={button} sponsorName={sponsorName} />
        ))}
      </div>
    );
  };

  for (const block of blocks) {
    if (block.type === 'button') {
      buttonRun.push(block);
      continue;
    }

    flushButtons();
    renderedBlocks.push(
      <SponsorCardBlock key={block.id} block={block} sponsorName={sponsorName} />
    );
  }

  flushButtons();

  return <>{renderedBlocks}</>;
}

/**
 * Renders one section inside a collaborator card.
 *
 * @param props - Section content and sponsor name used for accessible labels
 * @returns The section content, or null when there is nothing to render
 */
function SponsorCardSection({
  section,
  sponsorName,
}: SponsorCardSectionProps): React.ReactElement | null {
  if (section.blocks && section.blocks.length > 0) {
    if (!section.blocks.some(hasSponsorBlockContent)) return null;

    const tone = resolveSponsorHighlightTone(section.highlightTone, section.highlight);
    const toneClass = tone
      ? `rounded-lg p-4 ${SPONSOR_HIGHLIGHT_WRAPPER_CLASSES[tone]}`
      : 'text-green-dark';

    return (
      <div className={`w-full flex flex-col items-center gap-3 ${toneClass}`}>
        <SponsorCardBlocks blocks={section.blocks} sponsorName={sponsorName} />
      </div>
    );
  }

  const title = section.title?.trim();
  const badge = section.badge?.trim();
  const description = section.description?.trim();
  const buttons = getSponsorSectionButtons(section);

  if (!title && !badge && !description && buttons.length === 0) return null;

  const sectionLabel = title || sponsorName;
  const hasBody = Boolean(badge) || Boolean(description) || buttons.length > 0;
  const tone = resolveSponsorHighlightTone(section.highlightTone, section.highlight);
  const bodyToneClass = tone ? `rounded-lg p-4 ${SPONSOR_HIGHLIGHT_WRAPPER_CLASSES[tone]}` : '';

  return (
    <div className="w-full flex flex-col items-center gap-3 text-green-dark">
      {title && (
        <h5 className="text-lg font-bold text-green-dark text-center text-balance">{title}</h5>
      )}

      {hasBody && (
        <div className={`w-full flex flex-col items-center gap-3 ${bodyToneClass}`}>
          {badge && (
            <mark className="inline-flex max-w-full items-center justify-center rounded-full bg-green-forest px-6 py-3 text-center text-lg font-extrabold uppercase leading-tight text-white text-balance sm:text-xl">
              {badge}
            </mark>
          )}

          {description && (
            <p className="text-base leading-relaxed whitespace-pre-line text-center">
              {description}
            </p>
          )}

          {buttons.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {buttons.map((button) => (
                <SmartLink
                  key={button.id}
                  href={button.href}
                  variant={button.variant === 'secondary' ? 'secondary' : 'primary'}
                  aria-label={`${button.label} - ${sectionLabel}`}
                >
                  {button.label}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Card used to present a sponsor as a collaborator on the donations page.
 *
 * Renders the sponsor logo and name, followed by the configured content
 * sections. Sponsors that still have a legacy description are rendered with
 * the previous layout for backwards compatibility.
 *
 * On the public page, sponsors without sections or legacy content are not
 * rendered. In preview mode, an empty state is shown when there is no content.
 *
 * @param props - Component props
 * @returns The collaborator card, or null when there is no content outside preview mode
 *
 * @example
 * <SponsorCard
 *   sponsor={{
 *     id: 'sponsor-1',
 *     name: 'Refugio Amigo',
 *     href: 'https://example.com',
 *     logoWidth: 100,
 *     sections: [
 *       {
 *         id: 'section-1',
 *         blocks: [
 *           { id: 'block-1', type: 'title', text: 'Cómo ayudar' },
 *           {
 *             id: 'group-1',
 *             type: 'group',
 *             highlight: true,
 *             blocks: [
 *               { id: 'block-2', type: 'badge', text: '1 compra = 1 kg de comida' },
 *               { id: 'block-3', type: 'description', text: 'Elegí una de estas opciones.' },
 *               {
 *                 id: 'button-1',
 *                 type: 'button',
 *                 label: 'Donar',
 *                 href: 'https://example.com/donar',
 *                 variant: 'primary',
 *               },
 *             ],
 *           },
 *         ],
 *       },
 *     ],
 *     image: { imgId: 'img-1', imgUrl: '/logo.webp', imgAlt: 'Logo Refugio Amigo' },
 *   }}
 * />
 *
 * @example
 * // Admin preview with placeholders
 * <SponsorCard sponsor={formState} preview />
 */
export default function SponsorCard({
  sponsor,
  preview = false,
}: SponsorCardProps): React.ReactElement | null {
  const legacyDescription = sponsor.description?.trim();
  const sections = sponsor.sections ?? [];
  const hasSections = sections.some(hasSponsorSectionContent);
  const hasLegacyContent = Boolean(legacyDescription);
  if (!hasSections && !hasLegacyContent && !preview) return null;

  const displayName = sponsor.name.trim();
  const linkLabel = sponsor.linkLabel?.trim() || 'Ver más';
  const hasImage = Boolean(sponsor.image.imgUrl);
  const logoAspect = sponsor.logoAspect ?? 'auto';
  const aspectClass =
    logoAspect === 'square' ? 'aspect-square' : logoAspect === 'wide' ? 'aspect-[3/1]' : null;
  const hasLogoWidth = typeof sponsor.logoWidth === 'number';
  const logoWidth = Math.min(100, Math.max(20, sponsor.logoWidth ?? 100));
  const imageAlt = sponsor.image.imgAlt || displayName || 'Logo del colaborador';
  const imageSizes = `(max-width: 640px) ${logoWidth}vw, (max-width: 1024px) ${Math.round(
    logoWidth / 2
  )}vw, ${Math.round(logoWidth * 6)}px`;
  const showLegacyContent = !hasSections && hasLegacyContent;
  const showPreviewEmptyState = preview && !hasSections && !hasLegacyContent;

  return (
    <article className="flex flex-col items-center justify-between bg-white rounded-lg shadow-lg w-full py-8 px-4 gap-6">
      <header className="flex flex-col items-center gap-4 w-full">
        {hasImage ? (
          hasLogoWidth ? (
            <div style={{ width: `${logoWidth}%` }}>
              <Image
                src={sponsor.image.imgUrl}
                alt={imageAlt}
                width={1200}
                height={600}
                className="h-auto w-full object-contain"
                sizes={imageSizes}
              />
            </div>
          ) : aspectClass ? (
            <div className={`relative w-full ${aspectClass}`}>
              <Image
                src={sponsor.image.imgUrl}
                alt={imageAlt}
                fill
                className="object-contain"
                sizes={imageSizes}
              />
            </div>
          ) : (
            <Image
              src={sponsor.image.imgUrl}
              alt={imageAlt}
              width={1200}
              height={600}
              className="h-auto w-full object-contain"
              sizes={imageSizes}
            />
          )
        ) : preview ? (
          <div
            className={`flex w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 ${
              hasLogoWidth ? 'h-40' : (aspectClass ?? 'h-40')
            }`}
            style={hasLogoWidth ? { width: `${logoWidth}%` } : undefined}
          >
            Logo del colaborador
          </div>
        ) : null}
        <h4
          className={`font-bold text-2xl text-center text-balance ${
            displayName ? 'text-green-dark' : 'text-gray-400 italic'
          }`}
        >
          {displayName || 'Nombre del colaborador'}
        </h4>
      </header>

      <main className="w-full flex flex-col items-center gap-4">
        {showLegacyContent && (
          <section className="bg-cream-light p-6 rounded-lg text-center w-full">
            <p className="text-base leading-relaxed whitespace-pre-line text-green-dark">
              {legacyDescription}
            </p>
          </section>
        )}

        {sections.map((section) => (
          <SponsorCardSection key={section.id} section={section} sponsorName={displayName} />
        ))}

        {showPreviewEmptyState && (
          <div className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-400">
            La tarjeta todavía no tiene contenido. Agregá una sección para sumar títulos,
            descripciones o botones.
          </div>
        )}
      </main>

      {showLegacyContent && sponsor.href && (
        <footer className="w-full flex justify-center">
          <SmartLink
            href={sponsor.href}
            variant="primary"
            aria-label={`${linkLabel} - ${displayName || 'colaborador'}`}
          >
            {linkLabel}
          </SmartLink>
        </footer>
      )}
    </article>
  );
}
