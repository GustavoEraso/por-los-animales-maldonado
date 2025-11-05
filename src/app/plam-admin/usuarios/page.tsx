'use client';

import { useEffect, useState } from 'react';
import { UserType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import ProtectedRoute from '@/components/ProtectedRoute';
import FloatButton from '@/elements/FloatButton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { EditIcon, TrashIcon } from '@/components/Icons';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import RoleGuard from '@/components/RoleGuard';

export default function PlamAdminUsers() {
  const router = useRouter();
  const { currentUser, checkCanManageUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const fetchUsers = async () => {
    const res = await getFirestoreData({ currentCollection: 'authorizedEmails' });
    setUsers(res);
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
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle edit navigation
   */
  const handleEdit = (user: UserType) => {
    // Check permissions
    if (!checkCanManageUser(user.role)) {
      handleToast({
        type: 'error',
        title: 'Sin permisos',
        text: `No tienes permisos para editar usuarios con rol ${user.role}`,
      });
      return;
    }

    router.push(`/plam-admin/usuarios/editar/${user.id}`);
  };
  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin">
      <main className="flex flex-col   min-h-screen p-4 ">
        <h1 className="text-3xl font-bold mb-4">Esta es la lista de usuarios autorizados</h1>
        <table className="w-full text-sm text-left rtl:text-right ">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start ">Email</span>
              </th>
              <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start ">nombre</span>
              </th>
              <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start ">Rol</span>
              </th>
              <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-center ">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 &&
              users?.map((user) => {
                const canManage = checkCanManageUser(user.role);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                    <td
                      scope="row"
                      className="px-2 py-4 outline-1 outline-slate-200 font-medium text-gray-900 whitespace-nowrap "
                    >
                      {user.id}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-4 outline-1 outline-slate-200">{user.name}</td>
                    <td className="px-2 py-4 outline-1 outline-slate-200">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          user.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'rescatista'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-2 py-4 outline-1 outline-slate-200">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={loading || !canManage}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={
                            !canManage
                              ? 'No tienes permisos para editar este usuario'
                              : 'Editar usuario'
                          }
                        >
                          <EditIcon size={20} />
                        </button>
                        <RoleGuard requiredRole="superadmin">
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={loading || !canManage || isCurrentUser}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={
                              isCurrentUser
                                ? 'No puedes eliminar tu propio usuario'
                                : !canManage
                                  ? 'No tienes permisos para eliminar este usuario'
                                  : 'Eliminar usuario'
                            }
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
      </main>
      <FloatButton
        buttonStyle="add"
        action={() => {
          router.replace('/plam-admin/usuarios/crear');
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
