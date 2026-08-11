'use client';

import { useEffect, useState } from 'react';
import { UserRole, UserType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import ProtectedRoute from '@/components/ProtectedRoute';
import FloatButton from '@/elements/FloatButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { EditIcon, TrashIcon } from '@/components/Icons';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import RoleGuard from '@/components/RoleGuard';
import { logger } from '@/lib/logger';

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  rescatista: 'bg-green-100 text-green-800',
  user: 'bg-gray-100 text-gray-800',
};

export default function PlamAdminUsers() {
  const router = useRouter();
  const { currentUser, checkCanManageUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const fetchUsers = async (): Promise<void> => {
    try {
      const res = await getFirestoreData({ currentCollection: 'authorizedEmails' });
      setUsers(res);
    } catch (error) {
      logger({
        level: 'error',
        code: 'FETCH_USERS_ERROR',
        message: 'Error fetching users:',
        data: error,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Handle user deletion
   */
  const handleDelete = async (user: UserType) => {
    // Prevent deleting yourself
    if (user.id === currentUser?.id) {
      handleToast({
        type: 'error',
        title: 'Acción no permitida',
        text: 'No puedes eliminar tu propio usuario',
      });
      return;
    }

    // Check permissions
    if (!checkCanManageUser(user.role)) {
      handleToast({
        type: 'error',
        title: 'Sin permisos',
        text: `No tienes permisos para eliminar usuarios con rol ${user.role}`,
      });
      return;
    }

    // Open confirmation dialog
    setUserToDelete(user);
  };

  /**
   * Confirm and execute user deletion
   */
  const confirmDelete = async () => {
    if (!userToDelete || !currentUser) return;

    setLoading(true);
    setUserToDelete(null);

    try {
      // Create audit log before deleting
      await createAuditLog({
        type: 'user',
        action: 'delete',
        entityId: userToDelete.id,
        entityName: userToDelete.name,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: {
          before: {
            name: userToDelete.name,
            role: userToDelete.role,
          },
        },
      });

      await handlePromiseToast(
        deleteFirestoreData({
          collection: 'authorizedEmails',
          docId: userToDelete.id,
        }),
        {
          messages: {
            pending: {
              title: 'Eliminando usuario',
              text: 'Eliminando usuario del sistema...',
            },
            success: {
              title: 'Usuario eliminado',
              text: 'El usuario ha sido eliminado exitosamente',
            },
            error: {
              title: 'Error al eliminar',
              text: 'No se pudo eliminar el usuario',
            },
          },
        }
      );

      // Refresh list
      await fetchUsers();
    } catch (error) {
      logger({
        level: 'error',
        code: 'DELETE_USER_ERROR',
        message: 'Error deleting user:',
        data: error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex min-h-screen w-full min-w-0 flex-col gap-5 overflow-x-hidden px-3 py-5 pb-24 sm:gap-6 sm:px-6 sm:py-8 lg:px-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-green-forest">
              Administración
            </p>
            <h1 className="text-2xl font-bold leading-tight text-green-dark sm:text-3xl">
              Usuarios autorizados
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Gestiona quién puede acceder al panel de administración.
            </p>
          </div>
          <Link
            href="/plam-admin/usuarios/crear"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-forest focus-visible:ring-offset-2 sm:w-auto"
          >
            + Nuevo usuario
          </Link>
        </header>

        {loadingUsers ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm sm:p-12">
            <p role="status">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600 shadow-sm sm:p-12">
            <p className="font-medium">No hay usuarios autorizados.</p>
            <p className="mt-1 text-sm">Puedes crear el primero con el botón superior.</p>
          </div>
        ) : (
          <>
            <div className="hidden w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <table className="w-full table-fixed text-left text-sm text-gray-700">
                <caption className="sr-only">Lista de usuarios autorizados</caption>
                <thead className="bg-green-forest text-xs uppercase text-white">
                  <tr>
                    <th className="w-[42%] px-4 py-3 font-semibold" scope="col">
                      Email
                    </th>
                    <th className="w-[24%] px-4 py-3 font-semibold" scope="col">
                      Nombre
                    </th>
                    <th className="w-[18%] px-4 py-3 font-semibold" scope="col">
                      Rol
                    </th>
                    <th className="w-[16%] px-4 py-3 text-center font-semibold" scope="col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const canManage = checkCanManageUser(user.role);
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td
                          className="max-w-0 break-words px-4 py-4 font-medium text-gray-900"
                          scope="row"
                        >
                          <span className="break-all">{user.id}</span>
                          {isCurrentUser && (
                            <span className="ml-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              Tú
                            </span>
                          )}
                        </td>
                        <td className="max-w-0 break-words px-4 py-4">{user.name}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[user.role]}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-1">
                            {canManage && !loading ? (
                              <Link
                                href={`/plam-admin/usuarios/editar/${user.id}`}
                                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                title="Editar usuario"
                                aria-label={`Editar usuario ${user.name}`}
                              >
                                <EditIcon size={20} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 text-blue-600 opacity-50"
                                title="No tienes permisos para editar este usuario"
                                aria-label="Editar usuario no disponible"
                              >
                                <EditIcon size={20} />
                              </button>
                            )}
                            <RoleGuard requiredRole="superadmin">
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                disabled={loading || !canManage || isCurrentUser}
                                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                title={
                                  isCurrentUser
                                    ? 'No puedes eliminar tu propio usuario'
                                    : !canManage
                                      ? 'No tienes permisos para eliminar este usuario'
                                      : 'Eliminar usuario'
                                }
                                aria-label={`Eliminar usuario ${user.name}`}
                              >
                                <TrashIcon size={20} />
                              </button>
                            </RoleGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {users.map((user) => {
                const canManage = checkCanManageUser(user.role);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <article
                    key={user.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold leading-5 text-gray-900">
                          {user.id}
                        </p>
                        {isCurrentUser && (
                          <span className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            Tú
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <p className="mt-3 break-words text-base text-gray-700">{user.name}</p>

                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                      {canManage && !loading ? (
                        <Link
                          href={`/plam-admin/usuarios/editar/${user.id}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label={`Editar usuario ${user.name}`}
                        >
                          <EditIcon size={18} />
                          Editar
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-400"
                          aria-label="Editar usuario no disponible"
                        >
                          <EditIcon size={18} />
                          Editar
                        </button>
                      )}
                      <RoleGuard requiredRole="superadmin">
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={loading || !canManage || isCurrentUser}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            isCurrentUser
                              ? 'No puedes eliminar tu propio usuario'
                              : !canManage
                                ? 'No tienes permisos para eliminar este usuario'
                                : 'Eliminar usuario'
                          }
                          aria-label={`Eliminar usuario ${user.name}`}
                        >
                          <TrashIcon size={18} />
                        </button>
                      </RoleGuard>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
      <FloatButton
        buttonStyle="add"
        action={() => {
          router.push('/plam-admin/usuarios/crear');
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={userToDelete !== null}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar al usuario "${userToDelete?.name}"?\n\nEmail: ${userToDelete?.id}\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </ProtectedRoute>
  );
}
