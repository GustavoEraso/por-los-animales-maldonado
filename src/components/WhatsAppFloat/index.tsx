import React, { useState } from 'react';
import { XIcon, PhoneIcon, WhatsAppIcon } from '../Icons';

/**
 * Contact information for WhatsApp integration.
 */
interface Contact {
  /** Contact's display name */
  name: string;
  /** Phone number without country code */
  phone: string;
  /** Country code with + prefix (e.g., "+598") */
  countryCode: string;
}

/**
 * Props for the WhatsAppFloat component.
 */
interface WhatsAppFloatProps {
  /** Array of contacts to display in the WhatsApp list */
  contacts?: Contact[];
  /** Additional CSS classes for the floating button */
  className?: string;
}

/**
 * Current view state of the WhatsApp widget.
 */
type View = 'closed' | 'chatList';

// SVG Icons imported from centralized library

/**
 * Floating WhatsApp widget component with contact list and chat functionality.
 *
 * Provides a floating WhatsApp button that expands to show a list of contacts.
 * Users can click on contacts to open WhatsApp chat with them. Features a
 * pulsing animation, contact count badge, and responsive modal design.
 *
 * @param {WhatsAppFloatProps} props - Component props
 * @param {Contact[]} [props.contacts=[]] - Array of contacts to display
 * @param {string} [props.className=''] - Additional CSS classes for the floating button
 * @returns {React.ReactElement} The rendered WhatsApp float component
 *
 * @example
 * // Basic usage with contacts
 * const contacts = [
 *   { name: "Dr. María", phone: "99123456", countryCode: "+598" },
 *   { name: "Veterinaria Central", phone: "99654321", countryCode: "+598" }
 * ];
 * <WhatsAppFloat contacts={contacts} />
 *
 * @example
 * // With custom styling
 * <WhatsAppFloat
 *   contacts={contacts}
 *   className="custom-button-style"
 * />
 */
function WhatsAppFloat({ contacts = [], className = '' }: WhatsAppFloatProps): React.ReactElement {
  const [currentView, setCurrentView] = useState<View>('closed');

  // Opens WhatsApp chat with the specified contact
  const openWhatsApp = (contact: Contact, text: string = '') => {
    const phoneNumber = `${contact.countryCode}${contact.phone}`.replace(/\+/g, '');
    const encodedMessage = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${phoneNumber}${text ? `?text=${encodedMessage}` : ''}`;
    window.open(whatsappUrl, '_blank');
  };

  // Gets the first letter of a name for avatar display
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Formats phone number with country code for display
  const formatPhone = (phone: string, countryCode: string) => {
    return `${countryCode} ${phone}`;
  };

  // Renders the floating WhatsApp button
  const renderFloatingButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setCurrentView('chatList')}
        className={`relative bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transform transition-all duration-300 hover:scale-110 animate-pulse ${className}`}
        aria-label="Abrir WhatsApp"
      >
        <WhatsAppIcon size={24} color="currentColor" title="WhatsApp" />
        {contacts?.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {contacts.length}
          </span>
        )}
        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
      </button>
    </div>
  );

  // Renders the contact list modal
  const renderChatList = () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50"
      onClick={() => setCurrentView('closed')}
    >
      <div className="bg-white w-full max-w-md h-96 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">WhatsApp</h2>
          <button
            onClick={() => setCurrentView('closed')}
            className="hover:bg-green-700 rounded-full p-1 transition-colors"
            aria-label="Cerrar"
          >
            <XIcon size={20} color="currentColor" title="Cerrar" />
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {contacts?.length === 0 || !contacts ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <WhatsAppIcon
                size={48}
                color="currentColor"
                title="Sin contactos"
                className="mb-4 opacity-50"
              />
              <p>No hay contactos disponibles</p>
            </div>
          ) : (
            contacts.map((contact, index) => (
              <div
                key={index}
                onClick={() => {
                  openWhatsApp(contact);
                }}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {getInitials(contact.name)}
                </div>

                {/* Contact Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatPhone(contact.phone, contact.countryCode)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Click para abrir chat</p>
                </div>

                {/* WhatsApp Icon */}
                <div className="p-2 text-green-600">
                  <PhoneIcon size={16} color="currentColor" title="Teléfono" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentView === 'closed' && renderFloatingButton()}
      {currentView === 'chatList' && renderChatList()}
    </>
  );
}

export default WhatsAppFloat;
