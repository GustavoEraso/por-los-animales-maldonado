'use client';
import React from 'react';
import SmartLink from '@/lib/SmartLink';
import { navLinks } from '@/lib/navLinks';
import styles from './styles.module.css';
import { ChevronDownIcon, MenuIcon, XIcon } from '../Icons';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';

/**
 * Main navigation header component with responsive menu and authentication features.
 *
 * Renders the website header with logo, navigation menu, authentication status,
 * and responsive mobile menu. Includes login/logout functionality and admin dashboard
 * access for authenticated users.
 *
 * @returns {React.ReactElement} The rendered header component
 *
 * @example
 * // Basic usage
 * <Header />
 */
export default function Header(): React.ReactElement {
  const router = useRouter();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Successful logout, redirect user
        router.replace('/');
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsUserLoggedIn(false);
      } else {
        setIsUserLoggedIn(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const [visible, setVisible] = useState<boolean>(false);

  return (
    <header className="flex justify-between w-full items-center relative z-50 bg-white shadow-md p-4">
      <SmartLink
        href="/"
        className="w-32 h-32 flex-shrink-0"
        aria-label="Ir al inicio - Por los animales Maldonado"
      >
        <img
          className="block w-32 h-32 object-contain"
          src="/logo300.webp"
          alt="logo de por los animales maldonado"
        />
      </SmartLink>
      <nav className="hidden md:block">
        <ul className="flex space-x-4 text-md flex-wrap justify-center bg-white">
          {navLinks.map((link) => (
            <li className="group relative flex flex-col items-center" key={link.id + 'desktop'}>
              <SmartLink
                className={`inline-flex items-center gap-1 relative text-center p-2 ${styles.outline_bottom}`}
                href={link.url}
                aria-label={`Enlace a ${link.name}`}
              >
                {link.name}
                {link.childs && (
                  <ChevronDownIcon
                    size={12}
                    color="currentColor"
                    title="Expandir menú"
                    className="w-3 h-3"
                  />
                )}
              </SmartLink>
              {link.childs && (
                <ul className="absolute hidden group-hover:flex flex-col bottom-0 translate-y-full z-10 bg-white">
                  {link.childs.map((child) => (
                    <li key={child.id + 'desktop'}>
                      <SmartLink
                        className={`block text-center p-2 whitespace-nowrap ${styles.outline_bottom}`}
                        href={child.url}
                        aria-label={`Enlace a ${child.name}`}
                      >
                        {child.name}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {isUserLoggedIn ? (
        <div className="hidden md:flex justify-center items-center gap-4">
          <SmartLink
            className={`block text-center p-2 whitespace-nowrap ${styles.outline_bottom}`}
            href={'/plam-admin'}
            aria-label={'Enlace al panel de administración'}
          >
            Dashboard
          </SmartLink>

          <button
            onClick={handleLogout}
            className=" block text-lg  text-white leading-tight p-2 bg-caramel-deep hover:bg-amber-sunset uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full"
          >
            logout
          </button>
        </div>
      ) : (
        <div>
          <SmartLink href="/donaciones">
            <span className=" block text-lg  text-white leading-tight p-2 bg-caramel-deep hover:bg-amber-sunset uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full">
              Doná ahora
            </span>
          </SmartLink>
        </div>
      )}

      {/* Menu button */}
      <div className="bg-gray-200 p-2 rounded-md block md:hidden w-10 h-10">
        <button
          aria-label="boton menu"
          onClick={(e) => {
            e.preventDefault();
            setVisible(!visible);
          }}
        >
          <MenuIcon size={24} color="#5f6368" title="Abrir menú" />
        </button>
      </div>
      {/* Responsive menu */}
      <nav
        className={`${visible ? 'block' : 'hidden'} md:hidden  fixed top-0 right-0 left-0 bottom-0 bg-gray-200 flex flex-col items-center overflow-scroll`}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            setVisible(!visible);
          }}
          className="bg-gray-100 p-2 rounded-full self-end m-2"
        >
          <XIcon size={24} color="currentColor" title="Cerrar menú" className="w-6 h-6" />
        </button>
        <ul className="flex flex-col w-full gap-4 px-4 text-lg">
          {isUserLoggedIn && (
            <div className="flex flex-col-reverse justify-center items-center gap-4">
              <SmartLink
                className={`block text-center p-2 whitespace-nowrap text-2xl font-semibold ${styles.outline_bottom}`}
                href={'/plam-admin'}
                aria-label={'Enlace al panel de administración'}
                onClick={() => setVisible(false)}
              >
                Dashboard
              </SmartLink>

              <button
                onClick={handleLogout}
                className=" block text-lg  text-white leading-tight p-2 bg-caramel-deep hover:bg-amber-sunset uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full"
              >
                logout
              </button>
            </div>
          )}

          {navLinks.map((link) => (
            <li key={link.id + 'mobile'} className="w-full rounded-2xl overflow-hidden">
              {link.childs ? (
                <>
                  <h3 className="text-sm text-center font-bold">{link.name}:</h3>
                  <ul className="pl-4">
                    {link.childs.map((child) => (
                      <li key={child.id + 'mobile'} className="w-full rounded-2xl overflow-hidden">
                        <SmartLink
                          className="block text-center hover:bg-gray-300 p-2"
                          href={child.url}
                          aria-label={`Enlace a ${child.name}`}
                          onClick={() => setVisible(false)}
                        >
                          {child.name}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <SmartLink
                  className="block w-full text-center hover:bg-gray-300 p-2"
                  href={link.url}
                  onClick={() => setVisible(false)}
                  aria-label={`Enlace a ${link.name}`}
                >
                  {link.name}
                </SmartLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
