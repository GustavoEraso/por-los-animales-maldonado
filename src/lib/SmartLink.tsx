import React from 'react';
import Link from 'next/link';

/**
 * Props for the SmartLink component.
 * Extends all native anchor element attributes for full compatibility.
 */
interface SmartLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The URL to navigate to (internal or external) */
  href: string;
  /** Content to render inside the link */
  children: React.ReactNode;
}

/**
 * Smart link component that automatically chooses between Next.js Link and native anchor tag.
 *
 * Automatically detects if the href is internal or external and renders the appropriate
 * component with proper attributes for security and performance.
 *
 * Inherits all native anchor element props for full compatibility.
 *
 * @param props - The component props (extends all anchor attributes)
 * @returns React element (Link for internal routes, anchor for external)
 *
 * @example
 * // Internal link (renders Next.js Link)
 * <SmartLink href="/animales">Ver animales</SmartLink>
 *
 * @example
 * // External link (renders anchor with security attributes)
 * <SmartLink href="https://instagram.com/account">Instagram</SmartLink>
 *
 * @example
 * // Email link (renders anchor)
 * <SmartLink href="mailto:contact@example.com">Contactar</SmartLink>
 *
 * @example
 * // With all native anchor props
 * <SmartLink
 *   href="https://external.com"
 *   className="custom-class"
 *   aria-label="External site"
 *   id="external-link"
 *   title="Visit external site"
 *   data-testid="external-link"
 *   onMouseEnter={() => console.log('hovered')}
 * >
 *   External Site
 * </SmartLink>
 */
export default function SmartLink({
  href,
  children,
  ...props
}: SmartLinkProps): React.ReactElement {
  // Check if the URL is external
  const isExternal =
    href.startsWith('http') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('//');

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  // Internal link - use Next.js Link
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
