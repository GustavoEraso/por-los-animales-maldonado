'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/types';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/Loader';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { getChangedFieldsWithValues } from '@/lib/getChangedFields';
import { logger } from '@/lib/logger';
import ReturnButton from '@/components/ReturnButton';

/**
 * Page to edit an existing authorized user.
 * Only accessible by users with proper permissions based on role hierarchy.
 *
 * @param props - Resolved dynamic route parameters
 * @returns The interactive user edit form
 */
interface UserEditClientPageProps {
  userId: string;
}

export default function UserEditClientPage({
  userId,
}: UserEditClientPageProps): React.ReactElement {
  const router = useRouter();
  const { getAvailableRoles, checkCanManageUser, currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalUser, setOriginalUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<UserType>({
    id: '',
    name: '',
    role: 'user',
  });

  const availableRoles = getAvailableRoles();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      let resolvedId: string;
      try {
        resolvedId = decodeURIComponent(userId);
      } catch {
        resolvedId = userId;
      }

      try {
        const userData = await getFirestoreDocById({
          currentCollection: 'authorizedEmails',
          id: resolvedId,
        });

        if (!userData) {
          handleToast({
            type: 'error',
            title: 'Usuario no encontrado',
            text: 'El usuario que intentas editar no existe',
          });
          router.push('/plam-admin/usuarios');
          return;
        }

        const user: UserType = {
          id: (userData as UserType).id || resolvedId,
          name: (userData as UserType).name || '',
          role: (userData as UserType).role || 'user',
        };

        // Check permissions
        if (!checkCanManageUser(user.role)) {
          handleToast({
            type: 'error',
            title: 'Sin permisos',
            text: `No tienes permisos para editar usuarios con rol ${user.role}`,
          });
          router.push('/plam-admin/usuarios');
          return;
        }

        setOriginalUser(user);
        setFormData(user);
      } catch (error) {
        logger({
          level: 'error',
          code: 'FETCH_USER_ERROR',
          message: 'Error fetching user:',
          data: error,
        });
        handleToast({
          type: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
        });
        router.push('/plam-admin/usuarios');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, checkCanManageUser, router]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Check if form has changes
   */
  const hasChanges = (): boolean => {
    if (!originalUser) return false;
    return formData.name !== originalUser.name || formData.role !== originalUser.role;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      handleToast({
        type: 'error',
        title: 'Sesión no válida',
        text: 'No se pudo identificar el usuario actual',
      });
      return;
    }

    // Prevent editing yourself
    if (formData.id === currentUser?.id) {
      handleToast({
        type: 'error',
        title: 'Acción no permitida',
        text: 'No puedes editar tu propio usuario desde aquí',
      });
      return;
    }

    // Validation
    if (!formData.name) {
      handleToast({
        type: 'error',
        title: 'Campo requerido',
        text: 'El nombre es requerido',
      });
      return;
    }

    // Check if there are changes
    if (!hasChanges()) {
      handleToast({
        type: 'info',
        title: 'Sin cambios',
        text: 'No hay cambios para guardar',
      });
      return;
    }

    // Check permissions for new role
    if (!checkCanManageUser(formData.role)) {
      handleToast({
        type: 'error',
        title: 'Sin permisos',
        text: `No tienes permisos para asignar el rol ${formData.role}`,
      });
      return;
    }

    setSaving(true);

    try {
      // Get changed fields for audit log
      const { before, after } = getChangedFieldsWithValues({
        oldObj: originalUser || ({} as UserType),
        newObj: formData,
      });

      // Create audit log before updating user
      if (Object.keys(before).length > 0) {
        await createAuditLog({
          type: 'user',
          action: 'update',
          entityId: formData.id,
          entityName: formData.name,
          modifiedBy: currentUser.id,
          modifiedByName: currentUser.name,
          changes: {
            before,
            after,
          },
        });
      }

      await handlePromiseToast(
        postFirestoreData({
          data: {
            name: formData.name,
            role: formData.role,
            email: formData.id, // Keep email field for consistency
          },
          currentCollection: 'authorizedEmails',
          id: formData.id, // Use email as document ID
        }),
        {
          messages: {
            pending: {
              title: 'Actualizando usuario',
              text: 'Guardando cambios...',
            },
            success: {
              title: 'Usuario actualizado',
              text: 'Los cambios han sido guardados exitosamente',
            },
            error: {
              title: 'Error al actualizar',
              text: 'No se pudo guardar los cambios',
            },
          },
        }
      );

      router.push('/plam-admin/usuarios');
    } catch (error) {
      logger({
        level: 'error',
        code: 'UPDATE_USER_ERROR',
        message: 'Error updating user:',
        data: error,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    router.push('/plam-admin/usuarios');
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-5 sm:px-6 sm:py-8">
          <Loader />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-5 pb-24 sm:px-6 sm:py-8">
        <ReturnButton />
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md sm:p-6 md:p-8">
          <h1 className="mb-6 text-2xl font-bold leading-tight text-green-forest sm:text-3xl">
            Editar Usuario
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.id}
                disabled
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-base cursor-not-allowed sm:px-4"
              />
              <p className="mt-2 text-sm leading-5 text-gray-500">El email no se puede modificar</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={saving}
                className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-transparent focus:ring-2 focus:ring-green-forest disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4"
                placeholder="Juan Pérez"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
                Rol *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={saving}
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:border-transparent focus:ring-2 focus:ring-green-forest disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid gap-2 text-sm leading-5 text-gray-600 sm:grid-cols-3">
                <p className="rounded-lg bg-gray-50 p-3">
                  <strong className="mb-1 block text-gray-800">Rescatista</strong>
                  Puede gestionar animales y adopciones
                </p>
                <p className="rounded-lg bg-gray-50 p-3">
                  <strong className="mb-1 block text-gray-800">Admin</strong>
                  Puede gestionar rescatistas y todo el contenido
                </p>
                <p className="rounded-lg bg-gray-50 p-3">
                  <strong className="mb-1 block text-gray-800">Superadmin</strong>
                  Acceso completo al sistema
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
              <button
                type="submit"
                disabled={saving || !hasChanges()}
                className="min-h-11 w-full rounded-lg bg-green-forest px-6 py-3 font-semibold text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="min-h-11 w-full rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed sm:flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <h3 className="mb-2 flex items-start gap-2 font-semibold text-blue-900">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold"
              >
                i
              </span>
              <span>Información Importante</span>
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-5 text-blue-800">
              <li>El email no se puede modificar</li>
              <li>Los cambios en el rol afectarán los permisos del usuario</li>
              <li>Los cambios tardan 10 minutos en reflejarse en el sistema</li>
              <li>No puedes editar tu propio usuario</li>
              <li>Solo puedes editar usuarios con roles que estás autorizado a gestionar</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
