'use client';
import React, { useState } from 'react';
import { unstable_ViewTransition as ViewTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Animal, PrivateInfoType } from '@/types';
import ConfirmDialog from '@/components/ConfirmDialog';
import { EyeIcon, EditIcon, TrashIcon } from '@/components/Icons';

interface AdminAnimalCardProps {
  animal: Animal;
  privateInfo?: PrivateInfoType;
  onVisible?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
}

/**
 * Admin animal card component for displaying animal information in the dashboard.
 *
 * Renders an animal card with image, name, basic info, private information, and action buttons.
 * Designed specifically for the admin dashboard with additional controls and data.
 *
 * @param {Object} props - Component props
 * @param {Animal} props.animal - Animal data object containing all animal information
 * @param {PrivateInfoType} [props.privateInfo] - Optional private information for the animal
 * @param {Function} [props.onVisible] - Callback for visibility toggle (receives id and new state)
 * @param {Function} [props.onDelete] - Callback for delete action (receives id)
 * @returns {React.ReactElement} The rendered admin animal card component
 *
 * @example
 * // Basic usage
 * <AdminAnimalCard animal={animalData} />
 *
 * @example
 * // With private info and callbacks
 * <AdminAnimalCard
 *   animal={animalData}
 *   privateInfo={privateInfoMap.get(animalData.id)}
 *   onVisible={(id, active) => handleVisible({ currentId: id, active })}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
export default function AdminAnimalCard({
  animal,
  privateInfo,
  onVisible,
  onDelete,
}: AdminAnimalCardProps): React.ReactElement {
  const { id, name, gender, lifeStage, status, images } = animal;
  const img = images[0] ?? {
    imgUrl: '/logo300.webp',
    imgAlt: 'Imagen no disponible',
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleteDialogOpen(false);
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <article className="grid grid-rows-[1.8fr_1fr] rounded-xl overflow-hidden shadow bg-cream-light transition-shadow hover:shadow-lg">
      <div className="aspect-square">
        <ViewTransition name={`animal-${id}`}>
          <Link href={`/plam-admin/animales/${id}`} className="block w-full h-full">
            <Image
              src={img.imgUrl}
              alt={img.imgAlt}
              className="w-full h-full object-cover bg-white"
              width={300}
              height={300}
              loading="eager"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
          </Link>
        </ViewTransition>
      </div>

      <div className="flex flex-col items-center gap-1 p-2">
        <h3 className="uppercase text-2xl text-center font-extrabold">{name}</h3>
        <p className="text-center text-sm">{`${gender} | ${lifeStage}`}</p>
        <p className="text-center text-sm font-semibold">{status}</p>

        {/* Private Info Section */}
        {privateInfo && privateInfo.caseManager && (
          <p className="text-xs text-gray-600 text-center">
            Responsable: {privateInfo.caseManager}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 items-center justify-center w-full mt-1">
          {/* Visibility Toggle */}
          {onVisible && (
            <div className="flex  items-center gap-0.5">
              <span className="text-xs text-gray-600">Visible: </span>
              <label className="flex items-center cursor-pointer" title="Cambiar visibilidad">
                <input
                  type="checkbox"
                  onChange={() => onVisible(id, !animal.isVisible)}
                  className="sr-only peer"
                  checked={animal.isVisible}
                />
                <div className="relative w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          )}

          {/* View Details */}
          <Link
            href={`/plam-admin/animales/${id}`}
            className="p-1 text-green-600 hover:bg-green-100 rounded transition"
            title="Ver detalles"
          >
            <EyeIcon size={20} />
          </Link>

          {/* Edit */}
          <Link
            href={`/plam-admin/animales/editar/${id}`}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
            title="Editar"
          >
            <EditIcon size={20} />
          </Link>

          {/* Delete with ConfirmDialog */}
          {onDelete && (
            <>
              <button
                onClick={handleDeleteClick}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                title="Eliminar"
              >
                <TrashIcon size={20} />
              </button>

              <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Eliminar Animal"
                message={`¿Estás seguro de que quieres eliminar a ${name}?\n\nID: ${id}\n\nEsta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
