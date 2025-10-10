'use client';
import React from 'react';
import { handleToast } from '@/lib/handleToast';

interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether to apply bounce animation to the button
   * @default true
   */
  animate?: boolean;
  /**
   * Custom URL to share. If not provided, shares the current page URL
   * @default window.location.href
   */
  urlToShare?: string;
  /**
   * Custom title for the shared content
   * @default 'Por Los Animales Maldonado'
   */
  shareTitle?: string;
  /**
   * Custom text/description for the shared content
   * @default 'ayudanos a ayudar 🐾'
   */
  shareText?: string;
}

/**
 * Share button component that uses the Web Share API to share the current page.
 * Falls back to a toast notification if the browser doesn't support the Web Share API.
 *
 * @param {ShareButtonProps} props - Component props (extends all standard button HTML attributes)
 * @param {boolean} [props.animate=true] - Whether to apply bounce animation to the button
 * @param {string} [props.className] - Additional CSS classes to apply to the button
 * @param {string} [props.urlToShare] - Custom URL to share (defaults to current page URL)
 * @param {string} [props.shareTitle] - Custom title for the shared content (defaults to 'Por Los Animales Maldonado')
 * @param {string} [props.shareText] - Custom text/description for the shared content (defaults to 'ayudanos a ayudar 🐾')
 * @returns {React.ReactElement} Share button with Web Share API functionality
 *
 * @example
 * ```tsx
 * // Basic share button with animation (shares current page)
 * <ShareButton />
 *
 * // Share a specific URL with custom title and text
 * <ShareButton
 *   urlToShare="https://example.com/page"
 *   shareTitle="Adopta a Luna"
 *   shareText="Una hermosa perrita busca hogar 🐶"
 * />
 *
 * // Share button without animation
 * <ShareButton animate={false} />
 *
 * // Custom className with specific content
 * <ShareButton
 *   className="my-custom-class"
 *   urlToShare="https://example.com/adoption/dog-123"
 *   shareTitle="Conoce a Max"
 *   shareText="Un cachorro adorable esperando por ti"
 * />
 *
 * // Override default styles completely
 * <ShareButton className="bg-blue-500 text-white px-6 py-3" animate={false} />
 *
 * // With additional button props
 * <ShareButton disabled={isLoading} aria-label="Compartir página" />
 *
 * // In a card or section
 * <div className="flex justify-center mt-4">
 *   <ShareButton />
 * </div>
 *
 * // Multiple buttons layout
 * <div className="flex gap-4 justify-center">
 *   <ShareButton animate={false} />
 *   <button className="other-action-btn">Otra Acción</button>
 * </div>
 * ```
 *
 * @note Uses the native Web Share API when available, otherwise shows a toast notification.
 * The shared content includes the page title, description, and current URL.
 */
export default function ShareButton({
  animate = true,
  className,
  onClick,
  children,
  urlToShare,
  shareTitle,
  shareText,
  ...props
}: ShareButtonProps): React.ReactElement {
  const defaultClassName = `${animate ? 'animate-bounce' : ''} w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase`;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (navigator.share) {
      navigator
        .share({
          title: shareTitle || 'Por Los Animales Maldonado',
          text: shareText || 'ayudanos a ayudar 🐾',
          url: urlToShare || window.location.href,
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          handleToast({
            type: 'error',
            title: 'Error al compartir',
            text: 'No se pudo compartir. Intenta de nuevo.',
          });
        });
    } else {
      handleToast({
        type: 'warning',
        title: 'Función no disponible',
        text: 'Tu navegador no admite la función de compartir',
      });
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button className={className || defaultClassName} onClick={handleClick} {...props}>
      {children || 'Compartir Con Enlace'}
    </button>
  );
}
