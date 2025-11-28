import { AnimalTransactionType, beforeAfterType } from '@/types';
import Image from 'next/image';
import { formatedDateOnly } from '@/lib/dateUtils';
import { getRescueReasonLabel } from '@/lib/constants/animalLabels';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Transaction type labels mapping for display
 */
const TRANSACTION_PARSE: Record<string, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  transit_change: 'Cambio de tránsito',
  adoption: 'Adopción',
  return: 'Devolución',
  medical: 'Evento médico',
  vaccination: 'Vacunación',
  sterilization: 'Esterilización',
  emergency: 'Emergencia',
  supply: 'Suministro',
  followup: 'Seguimiento',
  note: 'Nota',
  other: 'Otro',
};

/**
 * Get the translated label for a transaction type
 * @param type - The transaction type key
 * @returns The translated label or the original type if not found
 */
function getTransactionLabel(type?: string) {
  if (!type) return 'Sin tipo';
  return TRANSACTION_PARSE[type] || type;
}

/**
 * Format a timestamp into a localized date string with time
 * @param date - Unix timestamp in milliseconds
 * @returns Formatted date string (dd/mm/yy hh:mm)
 */
const formatedDate = (date: number) =>
  new Date(date).toLocaleDateString('uy-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

/**
 * TransactionCard component displays an animal transaction with before/after changes
 * Includes scroll-triggered animation using GSAP
 *
 * @param transaction - The transaction data to display
 * @param showImg - Whether to show the animal image (default: false)
 * @returns React element representing the transaction card
 */
export default function TransactionCard({
  transaction,
  showImg = false,
}: {
  transaction: AnimalTransactionType;
  showImg?: boolean;
}): React.ReactElement {
  const cardRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          x: -30,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: cardRef }
  );

  const oldMode =
    transaction.changes?.before === undefined && transaction.changes?.after === undefined;
  return (
    <article
      ref={cardRef}
      className="relative flex flex-col border border-green-dark/15 rounded bg-white shadow-md p-4"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
        {showImg && (
          <section className=" flex flex-col  w-48 h-48">
            <Image
              src={transaction.img?.imgUrl || '/logo300.webp'}
              alt="animal image"
              width={64}
              height={64}
              className="w-full object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Prevent infinite loop if fallback also fails
                if (!img.dataset.fallback) {
                  img.dataset.fallback = 'true';
                  img.src = '/logo300.webp';
                }
              }}
            />
          </section>
        )}
        <ul className=" text-xl text-start font-semibold flex flex-col gap- p-2 bg-white ">
          <li className="font-semibold">
            {' '}
            Fecha: <span className="font-normal">{formatedDate(transaction.date)} hs</span>
          </li>
          {transaction.modifiedBy !== undefined && (
            <li className="font-semibold">
              {' '}
              Actualizado por: <span className="font-normal">{transaction.modifiedBy}</span>
            </li>
          )}
          {transaction.name !== undefined && (
            <li className="font-semibold">
              Nombre: <span className="font-normal">{transaction.name}</span>
            </li>
          )}
          {transaction.cost !== undefined && (
            <li className="font-semibold">
              El evento tuvo un costo de:{' '}
              <span className="font-semibold text-red-500">${transaction.cost}</span>
            </li>
          )}
        </ul>

        {transaction.transactionType && (
          <span className="absolute -top-3 -left-8 px-4 p-1 bg-amber-sunset text-white font-bold  rounded-full text-center w-fit shadow">
            {getTransactionLabel(transaction.transactionType)}
          </span>
        )}
        {!transaction.transactionType && (
          <span className="absolute -top-3 -left-8 px-10 p-4 bg-amber-sunset text-white font-bold  rounded-full text-center w-fit shadow">
            {'        '}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        {transaction.changes?.before &&
          (transaction.transactionType === 'note' ? (
            <ChangeList
              format="before"
              list={transaction.changes.before}
              title={transaction.changes.after ? 'Nota antes:' : 'Nota eliminada:'}
            />
          ) : (
            <ChangeList format="before" list={transaction.changes.before} />
          ))}
        {transaction.changes?.after &&
          (transaction.transactionType === 'note' ? (
            <ChangeList
              format="after"
              list={transaction.changes.after}
              title={transaction.changes.before ? 'Nota después:' : 'Nueva nota:'}
            />
          ) : (
            <ChangeList format="after" list={transaction.changes.after} />
          ))}

        {oldMode && <ChangeList format="after" list={transaction} />}
      </div>
    </article>
  );
}

/**
 * ChangeList component displays a list of changes in a transaction
 * Shows different styling for before/after states
 *
 * @param format - Whether this is a 'before' or 'after' change list
 * @param list - The data object containing the changes
 * @param title - Optional custom title for the change list
 * @returns React element representing the change list
 */
function ChangeList({
  format,
  list,
  title,
}: {
  format: 'before' | 'after';
  list: beforeAfterType;
  title?: string;
}): React.ReactElement {
  const hasTitle = title !== undefined;
  return (
    <ul
      className={`w-full ${format === 'before' ? 'bg-red-500/40' : 'bg-green-500/40'} p-2 rounded text-start`}
    >
      <h3 className="font-extrabold text-2xl text-start">
        {hasTitle ? title : format === 'before' ? 'Antes:' : 'Después:'}
      </h3>
      {list.caseManager !== undefined && (
        <li className="font-semibold">
          {' '}
          Responsable del caso: <span className="font-normal">{list.caseManager}</span>
        </li>
      )}
      {list.rescueReason !== undefined && (
        <li className="font-semibold">
          {' '}
          Motivo del rescate:{' '}
          <span className="font-normal">{getRescueReasonLabel(list.rescueReason)}</span>
        </li>
      )}
      {list.name !== undefined && (
        <li className="font-semibold">
          Nombre: <span className="font-normal">{list.name}</span>
        </li>
      )}
      {list.description !== undefined && (
        <li className="font-semibold flex flex-col">
          Descripción:{' '}
          <textarea
            className="text-green-dark text-normal font-normal field-sizing-content resize-none bg-white p-2 rounded"
            value={list.description}
            readOnly
            aria-label="Descripción del animal"
            disabled
          />
        </li>
      )}
      {list.species !== undefined && (
        <li className="font-semibold">
          {' '}
          Especie: <span className="font-normal">{list.species}</span>
        </li>
      )}
      {list.gender !== undefined && (
        <li className="font-semibold">
          Género: <span className="font-normal">{list.gender}</span>
        </li>
      )}
      {list.aproxBirthDate !== undefined && (
        <li className="font-semibold">
          Fecha de nacimiento aproximada:{' '}
          <span className="font-normal">{formatedDateOnly(list.aproxBirthDate)}</span>
        </li>
      )}
      {list.isSterilized !== undefined && (
        <li className="font-semibold">
          Esterilizado: <span className="font-normal">{`${list.isSterilized ? 'Si' : 'No'}`}</span>
        </li>
      )}
      {list.lifeStage !== undefined && (
        <li className="font-semibold">
          Etapa de vida: <span className="font-normal">{list.lifeStage}</span>
        </li>
      )}
      {list.size !== undefined && (
        <li className="font-semibold">
          {' '}
          Tamaño: <span className="font-normal">{list.size}</span>
        </li>
      )}
      {list.isAvalible !== undefined && (
        <li className="font-semibold">
          Estado:{' '}
          <span className="font-normal">{`${list.isAvalible ? 'Disponible' : 'No disponible'}`}</span>
        </li>
      )}
      {list.isVisible !== undefined && (
        <li className="font-semibold">
          Mostrar: <span className="font-normal">{`${list.isVisible ? 'Visible' : 'Oculto'}`}</span>
        </li>
      )}
      {list.isDeleted !== undefined && (
        <li className="font-semibold">
          Eliminado: <span className="font-normal">{`${list.isDeleted ? 'Si' : 'No'}`}</span>
        </li>
      )}
      {list.status !== undefined && (
        <li className="font-semibold">
          {' '}
          Situación actual: <span className="font-normal">{list.status}</span>
        </li>
      )}
      {list.waitingSince !== undefined && (
        <li className="font-semibold">
          {' '}
          Esperando Desde: <span className="font-normal">{formatedDate(list.waitingSince)}</span>
        </li>
      )}

      {list.medicalConditions !== undefined && (
        <li className="font-semibold">
          {' '}
          Patologías: <span className="font-normal">{list.medicalConditions}</span>
        </li>
      )}
      {list.vaccinations && list.vaccinations.length > 0 && (
        <li className="font-semibold">
          {' '}
          Vacunas:
          <ul className="list-disc pl-4 font-normal">
            {list.vaccinations.map((vaccination, vIndex) => (
              <li key={`${vIndex}-${vaccination.vaccine}`}>
                {vaccination.vaccine} -{' '}
                {new Date(vaccination.date).toLocaleDateString('es-UY', {
                  timeZone: 'UTC',
                })}
              </li>
            ))}
          </ul>
        </li>
      )}
      {Array.isArray(list.notes) && (
        <li className="font-semibold flex flex-col gap-2">
          {' '}
          <span>Notas: </span>
          {list?.notes?.map((note, index) => (
            <textarea
              key={index}
              value={note}
              disabled
              className="font-normal bg-white field-sizing-content resize-none py-2 px-4 rounded "
            />
          ))}
        </li>
      )}
      {list.contactName !== undefined && (
        <li className="font-semibold">
          {' '}
          Contacto: <span className="font-normal">{list.contactName}</span>
        </li>
      )}
      {list.contacts &&
        list.contacts.map((contact, index) => (
          <li key={`${index}-${contact.value}`} className=" font-semibold ">
            {contact.type}: <span className="font-normal">{contact.value}</span>
          </li>
        ))}
      {list.totalCost !== undefined && (
        <li className="font-semibold">
          {' '}
          Costo total acumulado:{' '}
          <span className="font-semibold text-red-500">${list.totalCost}</span>
        </li>
      )}
      <picture>
        {list.images && list.images.length > 0 && (
          <div className="flex gap-1">
            {list.images.map((image) => (
              <Image
                key={image.imgId}
                src={image.imgUrl}
                alt={image.imgAlt}
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  // Prevent infinite loop if fallback also fails
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = 'true';
                    img.src = '/logo300.webp';
                  }
                }}
              />
            ))}
          </div>
        )}
      </picture>
    </ul>
  );
}
