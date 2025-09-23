'use client';
import React from 'react';

/**
 * Share button component that uses the Web Share API to share the current page.
 * Falls back to an alert if the browser doesn't support the Web Share API.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.animate=true] - Whether to apply bounce animation to the button
 * @returns {React.ReactElement} Share button with Web Share API functionality
 *
 * @example
 * ```tsx
 * // Basic share button with animation
 * <ShareButton />
 *
 * // Share button without animation
 * <ShareButton animate={false} />
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
 * @note Uses the native Web Share API when available, otherwise shows an alert.
 * The shared content includes the page title, description, and current URL.
 */
export default function ShareButton({ animate = true }: { animate?: boolean }): React.ReactElement {
  return (
    <button
      className={`${animate ? 'animate-bounce' : ''} w-fit text-2xl text-center rounded-full px-4 py-2 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase`}
      onClick={() => {
        if (navigator.share) {
          navigator
            .share({
              title: 'Por Los Animales Maldonado',
              text: 'ayudanos a ayudar 🐾',
              url: window.location.href,
            })
            .catch((error) => console.error('Error sharing:', error));
        } else {
          alert('Tu navegador no admite la función de compartir');
        }
      }}
    >
      Compartir Con Enlace
    </button>
  );
}
