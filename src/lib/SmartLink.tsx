import React from 'react';
import Link from 'next/link';

const variantStyles = {
  primary:
    'w-fit inline-flex items-center justify-center text-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
  secondary:
    'w-fit inline-flex items-center justify-center text-center rounded-full border-2 border-amber-sunset bg-cream-light px-8 py-2 text-lg font-semibold text-caramel-deep shadow-sm transition-all duration-300 hover:bg-white hover:scale-[1.02]',
} as const;

type SmartLinkStyleProps =
  | { variant: keyof typeof variantStyles; className?: never }
  | { variant?: never; className?: string };

/**
 * Props for the SmartLink component.
 * Extends all native anchor element attributes for full compatibility.
 * `variant` and `className` are mutually exclusive — only one can be used at a time.
 */
type SmartLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> &
  SmartLinkStyleProps & {
    /** The URL to navigate to (internal or external) */
    href: string;
    /** Content to render inside the link */
    children: React.ReactNode;
  };

/**
 * Smart link component that automatically chooses between Next.js Link and native anchor tag.
 *
 * Automatically detects if the href is internal or external and renders the appropriate
 * component with proper attributes for security and performance.
 *
 * Optionally accepts a `variant` prop to apply predefined button styles from the design system.
 * When `variant` is set, it takes precedence over `className`.
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
 * // Primary button style
 * <SmartLink href="/nosotros" variant="primary">Ver más</SmartLink>
 *
 * @example
 * // Secondary button style
 * <SmartLink href="/nosotros" variant="secondary">Ver más</SmartLink>
 *
 * @example
 * // With custom className (ignored when variant is set)
 * <SmartLink href="/animales" className="text-xl text-center">Ver animales</SmartLink>
 */
export default function SmartLink({
  href,
  children,
  variant,
  className,
  ...props
}: SmartLinkProps): React.ReactElement {
  const resolvedClassName = variant ? variantStyles[variant] : className;
  // Check if the URL is external
  const isExternal =
    href.startsWith('http') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('//');

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={resolvedClassName}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Internal link - use Next.js Link
  return (
    <Link href={href} className={resolvedClassName} {...props}>
      {children}
    </Link>
  );
}
