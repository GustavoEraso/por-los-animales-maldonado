// app/dashboard/layout.tsx
'use client';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, HomeIcon, ImageIcon, PetsIcon, UserIcon } from '@/components/Icons';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/Loader';

/**
 * Dashboard layout component with role-based access control.
 * Only allows access to users with admin or superadmin roles.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, currentUser, isLoadingAuth, checkIsAdmin } = useAuth();
  const [showMenu, setShowMenu] = useState<boolean>(true);

  useEffect(() => {
    // Wait for auth to load before checking permissions
    if (isLoadingAuth) return;

    // Redirect if not authenticated
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    // Redirect if user doesn't have admin privileges
    if (!checkIsAdmin()) {
      router.replace('/');
      return;
    }
  }, [firebaseUser, currentUser, isLoadingAuth, checkIsAdmin, router]);

  // Show loading state while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Don't render admin content if not authorized
  if (!firebaseUser || !checkIsAdmin()) {
    return null;
  }

  return (
    <section className=" relative flex w-full min-h-screen ">
      <section className="absolute flex flex-col h-full bg-green-forest text-white  z-20">
        <section className=" sticky top-32 z-10">
          <div
            className={` transition-all duration-300 ${!showMenu ? 'w-0' : 'w-full px-2'} overflow-hidden pt-2`}
          >
            <Link
              className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 text-xl  hover:bg-cream-light hover:text-green-dark "
              href={'/plam-admin/'}
            >
              <span className="hidden md:block">MENU</span>
              <HomeIcon size={32} className="w-8 h-8 mb-2" title="Inicio" />
            </Link>
            <ul className="flex flex-col gap-1">
              <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                <Link
                  className="flex gap-1 items-center justify-between w-full px-2 py-1 "
                  href={'/plam-admin/animales'}
                >
                  <span className="hidden md:block">Animales</span>
                  <PetsIcon size={32} className="w-8 h-8 mb-2" title="Animales" />
                </Link>
              </li>

              <li className=" rounded flex hover:bg-cream-light hover:text-green-dark">
                <Link
                  className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                  href={'/plam-admin/usuarios'}
                >
                  <span className="hidden md:block">Usuarios</span>
                  <UserIcon size={32} className="w-8 h-8 mb-2" title="Usuarios" />
                </Link>
              </li>

              <li className=" rounded flex hover:bg-cream-light hover:text-green-dark">
                <Link
                  className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                  href={'/plam-admin/banners'}
                >
                  <span className="hidden md:block">banners</span>
                  <ImageIcon size={32} className="w-8 h-8 mb-2" title="banners" />
                </Link>
              </li>
            </ul>
          </div>
          <button
            className="absolute -right-5 top-1/2 -z-10  bg-green-forest  rounded-r-3xl h-20 "
            onClick={() => setShowMenu(!showMenu)}
          >
            <ChevronRightIcon
              size={24}
              className="w-6 h-6 transition-all duration-500"
              title="Toggle menu"
              style={{
                transform: showMenu ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                perspective: '1000px',
              }}
            />
          </button>
        </section>
      </section>
      <section className=" flex justify-center w-full overflow-x-scroll bg-cream-light ">
        {children}
      </section>
    </section>
  );
}
