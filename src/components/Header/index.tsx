'use client';
import React from 'react';
import Link from 'next/link';
import { navLinks } from '@/lib/navLinks';
import styles from './styles.module.css';

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

  const [visible, setVisibe] = useState<boolean>(false);

  return (
    <header className="flex justify-between w-full items-center relative z-50 bg-white shadow-md p-4">
      <div className="w-32 h-32 flex-shrink-0">
        <Link href="/">
          <img
            className="block w-32 h-32  object-contain"
            src="/logo300.webp"
            alt="logo de por los animales maldonado"
          />
        </Link>
      </div>
      <nav className="hidden md:block">
        <ul className="flex space-x-4 text-md flex-wrap justify-center bg-white">
          {navLinks.map((link) => (
            <li className="group relative flex flex-col items-center" key={link.id + 'desktop'}>
              <a
                className={`inline-flex items-center gap-1 relative text-center p-2 ${styles.outline_bottom}`}
                href={link.url}
                aria-label={`Enlace a ${link.name}`}
              >
                {link.name}
                {link.childs && (
                  <svg
                    className="w-3 h-3"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                )}
              </a>
              {link.childs && (
                <ul className="absolute hidden group-hover:flex flex-col bottom-0 translate-y-full z-10 bg-white">
                  {link.childs.map((child) => (
                    <li key={child.id + 'desktop'}>
                      <a
                        className={`block text-center p-2 whitespace-nowrap ${styles.outline_bottom}`}
                        href={child.url}
                        aria-label={`Enlace a ${child.name}`}
                      >
                        {child.name}
                      </a>
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
          <Link
            className={`block text-center p-2 whitespace-nowrap ${styles.outline_bottom}`}
            href={'/plam-admin'}
            aria-label={'Enlace al panel de administración'}
          >
            Dashboard
          </Link>

          <button
            onClick={handleLogout}
            className=" block text-lg  text-white leading-tight p-2 bg-caramel-deep hover:bg-amber-sunset uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full"
          >
            logout
          </button>
        </div>
      ) : (
        <div>
          <Link href="/donaciones">
            <span className=" block text-lg  text-white leading-tight p-2 bg-caramel-deep hover:bg-amber-sunset uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full">
              Doná ahora
            </span>
          </Link>
        </div>
      )}

      {/* Menu button */}
      <div className="bg-gray-200 p-2 rounded-md block md:hidden w-10 h-10">
        <button
          aria-label="boton menu"
          onClick={(e) => {
            e.preventDefault();
            setVisibe(!visible);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#5f6368"
          >
            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
          </svg>
        </button>
      </div>
      {/* Responsive menu */}
      <nav
        className={`${visible ? 'block' : 'hidden'} md:hidden  fixed top-0 right-0 left-0 bottom-0 bg-gray-200 flex flex-col items-center overflow-scroll`}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            setVisibe(!visible);
          }}
          className="bg-gray-100 p-2 rounded-full self-end m-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
        <ul className="flex flex-col w-full gap-4 px-4 text-lg">
          {isUserLoggedIn && (
            <div className="flex flex-col-reverse justify-center items-center gap-4">
              <a
                className={`block text-center p-2 whitespace-nowrap text-2xl font-semibold ${styles.outline_bottom}`}
                href={'/plam-admin'}
                aria-label={'Enlace al panel de administración'}
              >
                Dashboard
              </a>

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
                        <a
                          className="block text-center hover:bg-gray-300 p-2"
                          href={child.url}
                          aria-label={`Enlace a ${child.name}`}
                        >
                          {child.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <a
                  className="block w-full text-center hover:bg-gray-300 p-2"
                  href={link.url}
                  onClick={() => setVisibe(false)}
                  aria-label={`Enlace a ${link.name}`}
                >
                  {link.name}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
