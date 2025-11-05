'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserType } from '@/types';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/Loader';
import { createAuditLog } from '@/lib/firebase/createAuditLog';
import { getChangedFieldsWithValues } from '@/lib/getChangedFields';

/**
 * Page to edit an existing authorized user.
 * Only accessible by users with proper permissions based on role hierarchy.
 */
export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
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
      try {
        const userData = await getFirestoreDocById({
          currentCollection: 'authorizedEmails',
          id: decodeURIComponent(userId),
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
          id: (userData as UserType).id || decodeURIComponent(userId),
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
        console.error('Error fetching user:', error);
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
      console.error('Error updating user:', error);
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
        <div className="w-full max-w-4xl mx-auto p-6">
          <Loader />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-green-forest mb-6">Editar Usuario</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.id}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">El email no se puede modificar</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-forest focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Juan Pérez"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-forest focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Rescatista:</strong> Puede gestionar animales y adopciones
                </p>
                <p>
                  <strong>Admin:</strong> Puede gestionar rescatistas y todo el contenido
                </p>
                <p>
                  <strong>Superadmin:</strong> Acceso completo al sistema
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || !hasChanges()}
                className="flex-1 bg-green-forest text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
