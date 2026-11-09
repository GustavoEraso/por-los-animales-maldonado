import Image from 'next/image';
import SmartLink from '@/lib/SmartLink';
import { getSponsorSectionButtons, hasSponsorSectionContent } from '@/lib/sponsorCard';
import { SponsorSection, SponsorType } from '@/types';

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

/**
 * Renders one additional section inside a collaborator card.
 *
 * @param props - Section content and sponsor name used for accessible labels
 * @returns The section content, or null when there is nothing to render
 */
function SponsorCardSection({
  section,
  sponsorName,
}: SponsorCardSectionProps): React.ReactElement | null {
  const title = section.title?.trim();
  const badge = section.badge?.trim();
  const description = section.description?.trim();
  const buttons = getSponsorSectionButtons(section);

  if (!title && !badge && !description && buttons.length === 0) return null;

  const sectionLabel = title || sponsorName;
  const hasBody = Boolean(badge) || Boolean(description) || buttons.length > 0;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {title && (
        <h5 className="text-lg font-bold text-green-dark text-center text-balance">{title}</h5>
      )}

      {hasBody && (
        <div
          className={
            section.highlight
              ? 'w-full rounded-lg bg-cream-light p-4 flex flex-col items-center gap-3'
              : 'w-full flex flex-col items-center gap-3'
          }
        >
          {badge && (
            <mark className="inline-flex max-w-full items-center justify-center rounded-full bg-green-forest px-6 py-3 text-center text-lg font-extrabold uppercase leading-tight text-white text-balance sm:text-xl">
              {badge}
            </mark>
          )}

          {description && (
            <p className="text-base text-green-dark leading-relaxed whitespace-pre-line text-center">
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
 *         title: 'Cómo ayudar',
 *         badge: '1 compra = 1 kg de comida',
 *         description: 'Elegí una de estas opciones.',
 *         highlight: true,
 *         buttons: [
 *           { id: 'button-1', label: 'Donar', href: 'https://example.com/donar' },
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
