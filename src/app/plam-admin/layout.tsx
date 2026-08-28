// app/dashboard/layout.tsx
'use client';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRightIcon,
  EyeIcon,
  HomeIcon,
  ImageIcon,
  FormIcon,
  SponsorIcon,
  PetsIcon,
  UserIcon,
  WhatsAppIcon,
  RefreshIcon,
  FollowUpIcon,
  CheckIcon,
  CalendarIcon,
} from '@/components/Icons';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/Loader';
import RoleGuard from '@/components/RoleGuard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { revalidateCache } from '@/lib/revalidateCache';
import { handlePromiseToast } from '@/lib/handleToast';

/**
 * Dashboard layout component with role-based access control.
 * Only allows access to users with admin or superadmin roles.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, currentUser, isLoadingAuth } = useAuth();
  const [showMenu, setShowMenu] = useState<boolean>(true);

  useEffect(() => {
    // Wait for auth to load before checking permissions
    if (isLoadingAuth) return;

    // Redirect if not authenticated
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }
  }, [firebaseUser, currentUser, isLoadingAuth, router]);

  // Show loading state while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Don't render admin content if not authorized
  if (!firebaseUser) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="rescatista">
      <section className=" relative flex w-full min-h-screen ">
        <section className="absolute flex flex-col h-full bg-green-forest text-white  z-20">
          <section className=" sticky top-32 z-10">
            <div
              className={` transition-all duration-300 ${!showMenu ? 'w-0' : 'w-full px-2'} overflow-hidden pt-2`}
            >
              <Link
                className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 text-xl  hover:bg-cream-light hover:text-green-dark "
                href={'/plam-admin/'}
                prefetch={false}
              >
                <span className="hidden md:block">MENU</span>
                <HomeIcon size={32} className="w-8 h-8 mb-2" title="Inicio" />
              </Link>
              <ul className="flex flex-col gap-1">
                <RoleGuard requiredRole="rescatista">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/animales'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Animales</span>
                      <PetsIcon size={32} className="w-8 h-8 mb-2" title="Animales" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="rescatista">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/casos-externos'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Casos externos</span>
                      <CalendarIcon size={32} className="w-8 h-8 mb-2" title="Casos externos" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="rescatista">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/seguimientos'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Seguimientos</span>
                      <FollowUpIcon size={32} className="w-8 h-8 mb-2" title="Seguimientos" />
                    </Link>
                  </li>
                  {(process.env.NEXT_PUBLIC_SEGUIMIENTO_ADMIN_EMAILS || '')
                    .split(',')
                    .filter(Boolean)
                    .includes(firebaseUser?.email || '') && (
                    <li className="rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                      <Link
                        className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1"
                        href={'/plam-admin/seguimientos/confirmar'}
                        prefetch={false}
                      >
                        <span className="hidden md:block">Confirmar</span>
                        <CheckIcon size={32} className="w-8 h-8 mb-2" title="Confirmar Matches" />
                      </Link>
                    </li>
                  )}
                </RoleGuard>

                <RoleGuard requiredRole="admin">
                  <li className="rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/usuarios'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Usuarios</span>
                      <UserIcon size={32} className="w-8 h-8 mb-2" title="Usuarios" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="rescatista">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/contactos'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Contactos</span>
                      <WhatsAppIcon size={28} className="w-8 h-8 mb-2" title="Contactos" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="rescatista">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/formularios'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Formularios</span>
                      <FormIcon size={28} className="w-8 h-8 mb-2" title="Formularios" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="admin">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/banners'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">banners</span>
                      <ImageIcon size={32} className="w-8 h-8 mb-2" title="banners" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="admin">
                  <li className=" rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className=" rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1 "
                      href={'/plam-admin/sponsors'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Sponsors</span>
                      <SponsorIcon size={32} className="w-8 h-8 mb-2" title="Sponsors" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="superadmin">
                  <li className="rounded-2xl flex hover:bg-cream-light hover:text-green-dark">
                    <Link
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1"
                      href={'/plam-admin/logs'}
                      prefetch={false}
                    >
                      <span className="hidden md:block">Auditoría</span>
                      <EyeIcon size={32} className="w-8 h-8 mb-2" title="Auditoría" />
                    </Link>
                  </li>
                </RoleGuard>

                <RoleGuard requiredRole="admin">
                  <li className="rounded-2xl flex hover:bg-red-500 hover:text-white">
                    <button
                      className="rounded-2xl flex gap-1 items-center justify-between w-full px-2 py-1"
                      onClick={async () => {
                        await handlePromiseToast(revalidateCache('revalidate-all'), {
                          messages: {
                            pending: {
                              title: 'Invalidando caché...',
                              text: 'Por favor espera mientras se actualiza el caché',
                            },
                            success: {
                              title: 'Caché invalidado',
                              text: 'El caché fue invalidado exitosamente',
                            },
                            error: {
                              title: 'Error',
                              text: 'No se pudo invalidar el caché',
                            },
                          },
                        });
                      }}
                      title="Forzar actualización de todos los datos cacheados"
                    >
                      <span className="hidden md:block">Revalidar</span>
                      <RefreshIcon size={32} className="w-8 h-8 mb-2" title="Revalidar caché" />
                    </button>
                  </li>
                </RoleGuard>
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
    </ProtectedRoute>
  );
}
