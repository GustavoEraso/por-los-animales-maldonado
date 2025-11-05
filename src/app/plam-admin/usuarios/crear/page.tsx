'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { getFirestoreDocById } from '@/lib/firebase/getFirestoreDocById';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { createAuditLog } from '@/lib/firebase/createAuditLog';

/**
 * User data structure for creating new authorized users
 */
interface NewUserData {
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Page to create new authorized users in the system.
 * Only accessible by superadmin users.
 */
export default function CreateUserPage() {
  const router = useRouter();
  const { getAvailableRoles, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewUserData>({
    email: '',
    name: '',
    role: 'rescatista',
  });

  const availableRoles = getAvailableRoles();

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
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Check if email already exists in authorizedEmails collection
   */
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const existingUser = await getFirestoreDocById<NewUserData>({
        currentCollection: 'authorizedEmails',
        id: email,
      });
      return existingUser !== null;
    } catch (error) {
      // If document doesn't exist, getFirestoreDocById throws error
      return false;
    }
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

    // Validation
    if (!formData.email || !formData.name) {
      handleToast({
        type: 'error',
        title: 'Campos requeridos',
        text: 'Por favor completa todos los campos',
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      handleToast({
        type: 'error',
        title: 'Email inválido',
        text: 'Por favor ingresa un email válido',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);

      if (emailExists) {
        handleToast({
          type: 'error',
          title: 'Email duplicado',
          text: 'Este email ya está registrado en el sistema',
        });
        setLoading(false);
        return;
      }

      // Create audit log before creating user
      await createAuditLog({
        type: 'user',
        action: 'create',
        entityId: formData.email,
        entityName: formData.name,
        modifiedBy: currentUser.id,
        modifiedByName: currentUser.name,
        changes: {
          after: {
            name: formData.name,
            role: formData.role,
          },
        },
      });

      await handlePromiseToast(
        postFirestoreData({
          data: formData,
          currentCollection: 'authorizedEmails',
          id: formData.email, // Use email as document ID
        }),
        {
          messages: {
            pending: {
              title: 'Creando usuario',
              text: 'Guardando datos del nuevo usuario...',
            },
            success: {
              title: 'Usuario creado',
              text: 'El usuario ha sido creado exitosamente',
            },
            error: {
              title: 'Error al crear usuario',
              text: 'No se pudo crear el usuario. Intenta nuevamente.',
            },
          },
        }
      );

      // Reset form and navigate
      setFormData({
        email: '',
        name: '',
        role: 'user',
      });

      router.push('/plam-admin/usuarios');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    router.push('/plam-admin/usuarios');
  };

  return (
    <ProtectedRoute requiredRole="admin" redirectPath="/plam-admin/usuarios">
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-green-forest mb-6">Crear Nuevo Usuario</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-forest focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="usuario@ejemplo.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                El email será usado como identificador único del usuario
              </p>
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
                disabled={loading}
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
                disabled={loading}
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
                  <strong>rescatista:</strong> Puede gestionar animales y adopciones
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
                disabled={loading}
                className="flex-1 bg-green-forest text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
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
              <li>El usuario podrá iniciar sesión usando Google con este email</li>
              <li>El email debe coincidir exactamente con su cuenta de Google</li>
              <li>Los roles determinan qué acciones puede realizar en el sistema</li>
              <li>Solo los superadmins y admins pueden crear usuarios</li>
              <li>Solo los superadmins pueden eliminar usuarios</li>
              <li>La creación de usuarios tarda 10 minutos en reflejarse en el sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
