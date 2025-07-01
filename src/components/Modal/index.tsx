'use client';
import React, { useState } from 'react';

import type { SVGProps } from 'react';

import styles from './styles.module.css';



function XCircleIcon(props: SVGProps<SVGSVGElement>): React.ReactNode {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface ModalProps {
  buttonText: string
  children: React.ReactNode;
  buttonStyles?: string;
}

function Modal({ children, buttonText, buttonStyles }: ModalProps): React.ReactNode {
  const [isOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);






  return (
    <div>
      <button onClick={openModal} className={`${buttonStyles ? buttonStyles : "w-fit text-2xl rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance cursor-pointer"}`}>
        {buttonText}
      </button>

      {isOpen &&
        (<div className={`${styles.modal} ${isOpen ? styles.open : ''}`}>
          <button onClick={closeModal} className={`${styles.overlay}`}></button>
          <div className={styles.interno}>
            <section className={styles.modal_header}>
              <button onClick={closeModal} className="bg-white rounded-full text-black">
                <XCircleIcon className="h-6 w-6 text-black" />
              </button>
            </section>
            <section className={styles.interno__contain}>
              {children}
            </section>
          </div>
        </div>)
      }
    </div>
  );
}

export { Modal };

