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
import { logger } from '@/lib/logger';
import ReturnButton from '@/components/ReturnButton';

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const normalizedValue = name === 'email' ? value.toLowerCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
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
      logger({
        level: 'error',
        code: 'CHECK_EMAIL_EXISTENCE_ERROR',
        message: 'Error checking email existence:',
        data: error,
      });
      // If document doesn't exist, getFirestoreDocById throws error
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!currentUser) {
      handleToast({
        type: 'error',
        title: 'Sesión no válida',
        text: 'No se pudo identificar el usuario actual',
      });
      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();

    // Validation
    if (!normalizedEmail || !formData.name) {
      handleToast({
        type: 'error',
        title: 'Campos requeridos',
        text: 'Por favor completa todos los campos',
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
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
      const emailExists = await checkEmailExists(normalizedEmail);

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
        entityId: normalizedEmail,
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
          data: {
            ...formData,
            email: normalizedEmail,
          },
          currentCollection: 'authorizedEmails',
          id: normalizedEmail, // Use normalized email as document ID
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
        role: 'rescatista',
      });

      router.push('/plam-admin/usuarios');
    } catch (error) {
      logger({
        level: 'error',
        code: 'CREATE_USER_ERROR',
        message: 'Error creating user:',
        data: error,
      });
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
      <div className="mx-auto w-full min-w-0 max-w-3xl px-3 py-5 pb-24 sm:px-6 sm:py-8">
        <ReturnButton />
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md sm:p-6 md:p-8">
          <h1 className="mb-6 text-2xl font-bold leading-tight text-green-forest sm:text-3xl">
            Crear Nuevo Usuario
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
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
                className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-transparent focus:ring-2 focus:ring-green-forest disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4"
                placeholder="usuario@ejemplo.com"
              />
              <p className="mt-2 text-sm leading-5 text-gray-500">
                El email será usado como identificador único del usuario
              </p>
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
                disabled={loading}
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
                disabled={loading}
                autoComplete="off"
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
                disabled={loading}
                className="min-h-11 w-full rounded-lg bg-green-forest px-6 py-3 font-semibold text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-1"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
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
