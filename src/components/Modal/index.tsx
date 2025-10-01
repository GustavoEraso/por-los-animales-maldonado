'use client';
import React, { useState } from 'react';
import { XCircleIcon } from '../Icons';

import styles from './styles.module.css';

/**
 * Props for the Modal component.
 */
interface ModalProps {
  /** Text or React element to display on the modal trigger button */
  buttonText: string | React.ReactNode;
  /** Content to render inside the modal */
  children: React.ReactNode;
  /** Optional custom CSS classes for the button styling */
  buttonStyles?: string;
}

/**
 * Modal component with overlay and customizable trigger button.
 *
 * Provides a modal dialog that can be opened by clicking a trigger button.
 * The modal includes an overlay backdrop and a close button. Content is
 * fully customizable through the children prop. Button styling can be
 * customized or will use default caramel theme styling.
 *
 * @param {ModalProps} props - Component props
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {string | React.ReactNode} props.buttonText - Text or React element to display on the modal trigger button
 * @param {string} [props.buttonStyles] - Optional custom CSS classes for button styling
 * @returns {React.ReactNode} The rendered modal component
 *
 * @example
 * // Basic usage with default button styling
 * <Modal buttonText="Abrir Modal">
 *   <p>Contenido del modal aquí</p>
 * </Modal>
 *
 * @example
 * // With custom button styling
 * <Modal
 *   buttonText="Ver Detalles"
 *   buttonStyles="bg-blue-500 text-white px-6 py-2 rounded"
 * >
 *   <div>
 *     <h2>Título del Modal</h2>
 *     <p>Contenido personalizado</p>
 *   </div>
 * </Modal>
 *
 * @example
 * // With icon in button
 * <Modal
 *   buttonText={
 *     <>
 *       <TrashIcon size={16} />
 *       <span>Eliminar</span>
 *     </>
 *   }
 *   buttonStyles="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
 * >
 *   <p>Confirmar eliminación</p>
 * </Modal>
 */
function Modal({ children, buttonText, buttonStyles }: ModalProps): React.ReactNode {
  const [isOpen, setModalOpen] = useState(false);

  // Open modal handler
  const openModal = () => setModalOpen(true);
  // Close modal handler
  const closeModal = () => setModalOpen(false);

  return (
    <div>
      <button
        onClick={openModal}
        className={`${buttonStyles ? buttonStyles : 'w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance cursor-pointer'}`}
      >
        {buttonText}
      </button>

      {isOpen && (
        <div className={`${styles.modal} ${isOpen ? styles.open : ''}`}>
          <button onClick={closeModal} className={`${styles.overlay}`}></button>
          <div className={styles.interno}>
            <section className={styles.modal_header}>
              <button onClick={closeModal} className="bg-white rounded-full text-black">
                <XCircleIcon
                  size={24}
                  color="black"
                  title="Cerrar modal"
                  className="h-6 w-6 text-black"
                />
              </button>
            </section>
            <section className={styles.interno__contain}>{children}</section>
          </div>
        </div>
      )}
    </div>
  );
}

export { Modal };
