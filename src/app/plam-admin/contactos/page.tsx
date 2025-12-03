'use client';

import { useEffect, useState } from 'react';
import Loader from '@/components/Loader';
import { WpContactType } from '@/types';
import FloatButton from '@/elements/FloatButton';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { postFirestoreData } from '@/lib/firebase/postFirestoreData';
import { deleteFirestoreData } from '@/lib/firebase/deleteFirestoreData';
import { handlePromiseToast, handleToast } from '@/lib/handleToast';
import { PhoneIcon, TrashIcon, EditIcon } from '@/components/Icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { createAuditLog } from '@/lib/firebase/createAuditLog';

export default function ContactsPage() {
  const { currentUser, checkIsAdmin } = useAuth();
  const isAdmin = checkIsAdmin();

  const [loading, setLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<WpContactType[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [contactToDelete, setContactToDelete] = useState<WpContactType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<WpContactType | null>(null);
  const [showCacheInfoDialog, setShowCacheInfoDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<WpContactType>({
    id: '',
    name: '',
    phone: '',
    countryCode: '+598',
  });

  const MIN_LOADING_TIME = 600;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const start = Date.now();

    const fetchData = async () => {
      try {
        const data = await getFirestoreData({
          currentCollection: 'contacts',
        });
        setContacts(data as WpContactType[]);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [refresh]);

  const handleDelete = async () => {
    if (!contactToDelete) return;

    if (!isAdmin) {
      handleToast({
        type: 'warning',
        title: 'Acción no permitida',
        text: 'Solo los administradores pueden eliminar contactos. Por favor, solicita este cambio a un administrador.',
      });
      setContactToDelete(null);
      return;
    }

    const start = Date.now();
    setLoading(true);
    setContactToDelete(null);

    try {
      // Create audit log before deletion
      if (currentUser) {
        await createAuditLog({
          type: 'contact',
          action: 'delete',
          entityId: contactToDelete.id,
          entityName: contactToDelete.name,
          modifiedBy: currentUser.id,
          modifiedByName: currentUser.name,
          changes: {
            before: {
              name: contactToDelete.name,
              phone: contactToDelete.phone,
              countryCode: contactToDelete.countryCode,
            },
          },
        });
      }

      await handlePromiseToast(
        deleteFirestoreData({ collection: 'contacts', docId: contactToDelete.id }),
        {
          messages: {
            pending: {
              title: 'Eliminando contacto...',
              text: `Eliminando a ${contactToDelete.name}...`,
            },
            success: {
              title: 'Contacto eliminado',
              text: `${contactToDelete.name} fue eliminado exitosamente.`,
            },
            error: {
              title: 'Error',
              text: `Hubo un error al eliminar a ${contactToDelete.name}.`,
            },
          },
        }
      );

      setRefresh(!refresh);
      setShowCacheInfoDialog(true);
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean and format phone number
    const cleanedPhone = formData.phone.replace(/\s+/g, '');

    // Validate Uruguayan phone number format if country code is +598
    if (formData.countryCode === '+598') {
      const uruguayanPhoneRegex = /^09[0-9]{7}$/;

      if (!uruguayanPhoneRegex.test(cleanedPhone)) {
        handleToast({
          type: 'error',
          title: 'Formato inválido',
          text: 'Los números de Uruguay deben tener 9 dígitos y comenzar con 09 (ej: 091234567)',
        });
        return;
      }
    }

    const start = Date.now();
    setLoading(true);

    try {
      const contactData = {
        ...formData,
        phone: cleanedPhone,
        id: editingContact?.id || `contact-${Date.now()}`,
      };

      // Create audit log
      if (currentUser) {
        await createAuditLog({
          type: 'contact',
          action: editingContact ? 'update' : 'create',
          entityId: contactData.id,
          entityName: contactData.name,
          modifiedBy: currentUser.id,
          modifiedByName: currentUser.name,
          changes: editingContact
            ? {
                before: {
                  name: editingContact.name,
                  phone: editingContact.phone,
                  countryCode: editingContact.countryCode,
                },
                after: {
                  name: contactData.name,
                  phone: contactData.phone,
                  countryCode: contactData.countryCode,
                },
              }
            : {
                after: {
                  name: contactData.name,
                  phone: contactData.phone,
                  countryCode: contactData.countryCode,
                },
              },
        });
      }

      await handlePromiseToast(
        postFirestoreData<WpContactType>({
          data: contactData,
          currentCollection: 'contacts',
          id: contactData.id,
        }),
        {
          messages: {
            pending: {
              title: editingContact ? 'Actualizando contacto...' : 'Creando contacto...',
              text: `Por favor espera...`,
            },
            success: {
              title: editingContact ? 'Contacto actualizado' : 'Contacto creado',
              text: `${formData.name} fue ${editingContact ? 'actualizado' : 'creado'} exitosamente.`,
            },
            error: {
              title: 'Error',
              text: `Hubo un error al ${editingContact ? 'actualizar' : 'crear'} el contacto.`,
            },
          },
        }
      );

      setIsModalOpen(false);
      setEditingContact(null);
      setFormData({ id: '', name: '', phone: '', countryCode: '+598' });
      setRefresh(!refresh);
      setShowCacheInfoDialog(true);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    if (!isAdmin) {
      handleToast({
        type: 'warning',
        title: 'Acción no permitida',
        text: 'Solo los administradores pueden crear contactos. Por favor, solicita este cambio a un administrador.',
      });
      return;
    }
    setEditingContact(null);
    setFormData({ id: '', name: '', phone: '', countryCode: '+598' });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: WpContactType) => {
    if (!isAdmin) {
      handleToast({
        type: 'warning',
        title: 'Acción no permitida',
        text: 'Solo los administradores pueden editar contactos. Por favor, solicita este cambio a un administrador.',
      });
      return;
    }
    setEditingContact(contact);
    setFormData(contact);
    setIsModalOpen(true);
  };

  const openWhatsApp = (contact: WpContactType) => {
    const phoneNumber = `${contact.countryCode}${contact.phone}`.replace(/\+/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="/plam-admin">
      <section className="bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-4 items-center pb-28 min-h-screen">
        <div className="w-full flex justify-between items-center px-4">
          <h1 className="text-3xl font-bold text-green-dark">Contactos de WhatsApp</h1>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
              <PhoneIcon
                size={64}
                color="currentColor"
                title="Sin contactos"
                className="mb-4 opacity-50"
              />
              <p className="text-xl">No hay contactos disponibles</p>
              <p className="text-sm mt-2">Haz clic en el botón + para agregar un nuevo contacto</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <article
                key={contact.id}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-dark">{contact.name}</h3>
                      <p className="text-sm text-gray-600">
                        {contact.countryCode} {contact.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openWhatsApp(contact)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                  >
                    <PhoneIcon size={16} color="currentColor" title="Llamar" />
                    Abrir WhatsApp
                  </button>
                  <button
                    onClick={() => openEditModal(contact)}
                    className={`rounded-lg px-3 py-2 transition-colors ${
                      isAdmin
                        ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    aria-label="Editar"
                  >
                    <EditIcon size={16} color="currentColor" title="Editar" />
                  </button>
                  <button
                    onClick={() => {
                      if (!isAdmin) {
                        handleToast({
                          type: 'warning',
                          title: 'Acción no permitida',
                          text: 'Solo los administradores pueden eliminar contactos. Por favor, solicita este cambio a un administrador.',
                        });
                        return;
                      }
                      setContactToDelete(contact);
                    }}
                    className={`rounded-lg px-3 py-2 transition-colors ${
                      isAdmin
                        ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    aria-label="Eliminar"
                  >
                    <TrashIcon size={16} color="currentColor" title="Eliminar" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {isAdmin && <FloatButton buttonStyle="add" action={openCreateModal} />}

        {!isAdmin && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() =>
                handleToast({
                  type: 'info',
                  title: 'Solo lectura',
                  text: 'Tienes acceso de solo lectura. Para hacer cambios, solicita ayuda a un administrador.',
                })
              }
              className="bg-gray-400 text-white rounded-full p-4 shadow-lg cursor-not-allowed opacity-50"
              aria-label="Agregar contacto (deshabilitado)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Modal for create/edit */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-green-dark mb-4">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Dr. Juan Pérez"
                  />
                </div>

                <div>
                  <label
                    htmlFor="countryCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Código de país
                  </label>
                  <input
                    type="text"
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: +598"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: 99123456"
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 font-medium transition-colors"
                  >
                    {editingContact ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingContact(null);
                      setFormData({ id: '', name: '', phone: '', countryCode: '+598' });
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={contactToDelete !== null}
          title="Eliminar Contacto"
          message={`¿Estás seguro de que quieres eliminar a ${contactToDelete?.name}?\n\nEsta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setContactToDelete(null)}
        />

        <ConfirmDialog
          isOpen={showCacheInfoDialog}
          title="Cambios guardados exitosamente"
          message="Los cambios se han guardado correctamente. Ten en cuenta que pueden tardar hasta 10 minutos en reflejarse en la página pública debido al caché del sistema."
          confirmText="Entendido"
          variant="primary"
          onConfirm={() => setShowCacheInfoDialog(false)}
        />
      </section>
    </ProtectedRoute>
  );
}
