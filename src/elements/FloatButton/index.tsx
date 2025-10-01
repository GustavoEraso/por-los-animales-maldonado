import React from 'react';
import { PlusIcon, EditIcon } from '@/components/Icons';

/**
 * Props for the FloatButton component.
 */
interface FloatButtonProps {
  /** Function to execute when the button is clicked */
  action: () => void;
  /** Visual style of the button determining the icon displayed */
  buttonStyle: 'add' | 'edit';
}

/**
 * Floating action button component with customizable icons and actions.
 *
 * Displays a fixed-position floating button in the bottom-right corner of the screen.
 * Features hover opacity effects and supports two visual styles with corresponding
 * icons: 'add' for creation actions and 'edit' for modification actions.
 *
 * @param {FloatButtonProps} props - Component props
 * @param {function} props.action - Function to execute when the button is clicked
 * @param {string} props.buttonStyle - Visual style determining the icon (add|edit)
 * @returns {React.ReactElement} The rendered floating action button
 *
 * @example
 * // Add button for creating new items
 * <FloatButton
 *   action={() => navigate('/admin/animals/new')}
 *   buttonStyle="add"
 * />
 *
 * @example
 * // Edit button for modifying existing items
 * <FloatButton
 *   action={() => setEditMode(true)}
 *   buttonStyle="edit"
 * />
 *
 * @example
 * // Add new animal button in admin panel
 * <FloatButton
 *   action={() => router.push('/admin/animals/create')}
 *   buttonStyle="add"
 * />
 */
export default function FloatButton({ action, buttonStyle }: FloatButtonProps): React.ReactElement {
  return (
    <div className=" w-16 h-16 fixed right-3 bottom-3 rounded-full outline flex items-center justify-center overflow-hidden opacity-50 hover:opacity-100 ">
      <button
        onClick={action}
        className="w-full h-full bg-green-400 flex items-center justify-center "
      >
        {buttonStyle === 'add' && (
          <PlusIcon size={64} color="currentColor" title="Agregar" className="w-16 h-16" />
        )}
        {buttonStyle === 'edit' && (
          <EditIcon size={48} color="currentColor" title="Editar" className="w-12 h-12" />
        )}
      </button>
    </div>
  );
}
