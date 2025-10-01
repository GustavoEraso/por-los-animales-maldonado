import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { navLinks } from '@/lib/navLinks';
import { FacebookIcon, InstagramIcon, ChevronDownIcon } from '../Icons';

/**
 * Website footer component with navigation, social links, and copyright information.
 *
 * Renders the main footer with logo, navigation menu with dropdowns, social media links
 * (Facebook and Instagram), and copyright information. Includes responsive design
 * with different layouts for mobile and desktop.
 *
 * @returns {React.ReactElement} The rendered footer component
 *
 * @example
 * // Basic usage
 * <Footer />
 */
export default function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-caramel-deep text-white pt-8 flex flex-col gap-8">
      <section className="  flex flex-col  items-center justify-center md:flex-row md:justify-around gap-4">
        <div className="  flex flex-col items-center justify-center">
          <Link href="/" aria-label="Inicio">
            <Image
              src="/logo300.webp"
              alt="Logo de Por los Animales Maldonado"
              width={256}
              height={256}
              priority
              className="w-64 h-64 object-contain"
            />
          </Link>
          <section className="flex gap-4 ">
            <a
              href="https://www.facebook.com/PorLosAnimalesMaldonado"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enlace a Facebook"
            >
              <FacebookIcon
                size={24}
                color="currentColor"
                title="Facebook"
                className="w-6 h-6 text-white hover:text-gray-300"
              />
            </a>
            <a
              href="https://www.instagram.com/porlosanimales_maldonado/?hl=es"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enlace a Instagram"
            >
              <InstagramIcon
                size={24}
                color="currentColor"
                title="Instagram"
                className="w-6 h-6 text-white hover:text-gray-300"
              />
            </a>
          </section>
        </div>
        <nav className="block" aria-label="Enlaces del sitio">
          <ul className="flex flex-col text-md  justify-around w-fit">
            {navLinks.map((link) => (
              <li className="group relative flex flex-col items-center" key={link.id + 'footer'}>
                <Link
                  className={`inline-flex items-center gap-1 relative text-center p-2 `}
                  href={link.url}
                  aria-label={`Enlace a ${link.name}`}
                >
                  {link.name}
                  {link.childs && (
                    <ChevronDownIcon
                      size={12}
                      color="currentColor"
                      title="Expandir menú"
                      className="w-3 h-3 hidden md:block"
                    />
                  )}
                </Link>
                {link.childs && (
                  <ul className="absolute hidden  md:group-hover:flex flex-col left-0 -translate-x-full  z-10 bg-white text-caramel-deep">
                    {link.childs.map((child) => (
                      <li key={child.id + 'desktop'}>
                        <Link
                          className={`block text-center p-2 whitespace-nowrap `}
                          href={child.url}
                          aria-label={`Enlace a ${child.name}`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <div className="w-full bg-gray-800 py-4">
        <p className="text-center text-sm text-gray-400">
          © {currentYear} Por los Animales Maldonado
          <span className="mx-1">|</span>
          Desarrollado por{' '}
          <a
            href="https://gustavoeraso.com"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-bold hover:text-amber-800"
          >
            Gustavo Eraso
          </a>
        </p>
      </div>
    </footer>
  );
}
