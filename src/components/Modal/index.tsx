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
  /** Optional controlled isOpen state from parent */
  isOpen?: boolean;
  /** Optional setter function to control modal state from parent */
  setIsOpen?: (open: boolean) => void;
}

/**
 * Modal component with overlay and customizable trigger button.
 *
 * Provides a modal dialog that can be opened by clicking a trigger button.
 * The modal includes an overlay backdrop and a close button. Content is
 * fully customizable through the children prop. Button styling can be
 * customized or will use default caramel theme styling.
 *
 * Supports both controlled and uncontrolled modes:
 * - Uncontrolled: Modal manages its own state internally
 * - Controlled: Parent component controls the modal state via isOpen and onOpenChange props
 *
 * @param {ModalProps} props - Component props
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {string | React.ReactNode} props.buttonText - Text or React element to display on the modal trigger button
 * @param {string} [props.buttonStyles] - Optional custom CSS classes for button styling
 * @param {boolean} [props.isOpen] - Optional controlled isOpen state from parent. If provided, modal operates in controlled mode
 * @param {function} [props.setIsOpen] - Optional setter function to control modal state from parent. Receives new open state as argument
 * @returns {React.ReactNode} The rendered modal component
 *
 * @example
 * // Basic usage with default button styling (uncontrolled)
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
 * // Controlled mode - parent manages modal state
 * const [modalOpen, setModalOpen] = useState(false);
 *
 * <Modal
 *   buttonText="Abrir"
 *   isOpen={modalOpen}
 *   setIsOpen={setModalOpen}
 * >
 *   <p>Modal controlado desde el padre</p>
 *   <button onClick={() => setModalOpen(false)}>Cerrar desde dentro</button>
 * </Modal>
 *
 * // Control from outside
 * <button onClick={() => setModalOpen(true)}>Abrir modal desde fuera</button>
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
function Modal({
  children,
  buttonText,
  buttonStyles,
  isOpen: controlledIsOpen,
  setIsOpen: setControlledIsOpen,
}: ModalProps): React.ReactNode {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = setControlledIsOpen || setInternalIsOpen;

  // Open modal handler
  const openModal = () => setIsOpen(true);
  // Close modal handler
  const closeModal = () => setIsOpen(false);

  return (
    <div>
      <button
        onClick={openModal}
        className={`${buttonStyles ? buttonStyles : 'w-fit inline-flex items-center justify-center rounded-full border border-amber-sunset bg-gradient-to-b from-amber-sunset to-caramel-deep px-8 py-2 text-lg font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'}`}
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
