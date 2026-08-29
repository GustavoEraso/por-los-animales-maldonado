import { AnimalTransactionType, beforeAfterType, Img } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { formatedDateOnly } from '@/lib/dateUtils';
import { getRescueReasonLabel, getTransactionLabel } from '@/lib/constants/animalLabels';
import { getPdfThumbnailUrl } from '@/lib/pdfThumbnail';
import { memo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
export default memo(function TransactionCard({
  transaction,
  showImg = false,
  showAnimalLink = false,
}: {
  transaction: AnimalTransactionType;
  showImg?: boolean;
  showAnimalLink?: boolean;
}): React.ReactElement {
  const cardRef = useRef<HTMLElement>(null);
  const [fullscreenImg, setFullscreenImg] = useState<Img | null>(null);

  /** Normalize eventImg to Img[] for backward compatibility with legacy single-image transactions */
  const normalizedEventImages: Img[] = transaction.eventImg
    ? Array.isArray(transaction.eventImg)
      ? transaction.eventImg
      : [transaction.eventImg]
    : [];

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
    <>
      <article
        ref={cardRef}
        className="relative flex flex-col border border-green-dark/15 rounded bg-white shadow-md p-4"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 pb-2">
          {showImg && (
            <section className=" flex flex-col  w-48 h-48">
              <Image
                src={transaction.img?.imgUrl || '/logo300.webp'}
                alt="animal image"
                width={64}
                height={64}
                className="w-full aspect-square object-cover"
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
          {normalizedEventImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {normalizedEventImages.map((img) => (
                <button
                  key={img.imgId}
                  type="button"
                  onClick={() => setFullscreenImg(img)}
                  className="flex flex-col w-24 h-24 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Ver imagen ampliada"
                >
                  <Image
                    src={img.imgUrl || '/logo300.webp'}
                    alt={img.imgAlt || 'Imagen del evento'}
                    width={96}
                    height={96}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const imgEl = e.currentTarget as HTMLImageElement;
                      if (!imgEl.dataset.fallback) {
                        imgEl.dataset.fallback = 'true';
                        imgEl.src = '/logo300.webp';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          {transaction.eventPdfs && transaction.eventPdfs.length > 0 && (
            <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
              <span className="font-semibold text-red-800">Documentos PDF:</span>
              {/* max-w-64 = exactly three w-20 columns plus two gap-2 gutters, so up
                  to three thumbnails share one row and extra ones wrap below */}
              <div className="flex max-w-64 flex-wrap items-center justify-center gap-2">
                {transaction.eventPdfs.map((pdf) => (
                  <div key={pdf.publicId} className="flex w-20 shrink-0 flex-col gap-1.5">
                    <a
                      href={pdf.secureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Abrir ${pdf.fileName}`}
                      className="block overflow-hidden rounded-lg border border-red-200 bg-white transition-opacity hover:opacity-80"
                    >
                      <Image
                        src={getPdfThumbnailUrl(pdf.secureUrl)}
                        alt={`Primera página de ${pdf.fileName}`}
                        width={400}
                        height={566}
                        loading="lazy"
                        className="h-auto w-full object-contain"
                        onError={(e) => {
                          const imgEl = e.currentTarget as HTMLImageElement;
                          if (!imgEl.dataset.fallback) {
                            imgEl.dataset.fallback = 'true';
                            imgEl.src = '/logo300.webp';
                          }
                        }}
                      />
                    </a>
                    <a
                      href={pdf.secureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={pdf.fileName}
                      className="flex min-w-0 items-center gap-1.5 text-sm text-red-700 underline hover:text-red-900"
                    >
                      <span className="shrink-0 rounded bg-red-200 px-1.5 py-0.5 text-xs font-bold">
                        PDF
                      </span>
                      <span className="truncate">{pdf.fileName}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
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
            {transaction.transactionType === 'adoption' &&
              (transaction as AnimalTransactionType & { adoptionFormId?: string })
                .adoptionFormId && (
                <li className="font-semibold">
                  Formulario:{' '}
                  <Link
                    href={`/plam-admin/formularios/${(transaction as AnimalTransactionType & { adoptionFormId?: string }).adoptionFormId}`}
                    className="text-green-600 hover:text-green-800 underline font-normal"
                  >
                    {(transaction as AnimalTransactionType & { adoptionFormName?: string })
                      .adoptionFormName ?? 'Ver formulario'}{' '}
                    →
                  </Link>
                </li>
              )}
            {showAnimalLink && !transaction.isExternal && (
              <li className="font-semibold">
                {' '}
                Ficha:{' '}
                <Link
                  href={`/plam-admin/animales/${transaction.id}`}
                  prefetch={false}
                  className="text-green-600 hover:text-green-800 underline font-normal"
                >
                  Ver animal →
                </Link>
              </li>
            )}
            {transaction.isExternal && (
              <li className="font-semibold">
                {' '}
                <span className="px-2 py-0.5 bg-gray-700 text-white text-xs font-bold rounded-full">
                  Caso externo
                </span>
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
      {fullscreenImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreenImg(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={fullscreenImg.imgUrl}
              alt={fullscreenImg.imgAlt || 'Imagen del evento'}
              width={1200}
              height={900}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setFullscreenImg(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:bg-gray-200 transition-colors"
              title="Cerrar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
});

const HANDLED_KEYS = new Set([
  'caseManager',
  'followUpManager',
  'rescueReason',
  'name',
  'newName',
  'description',
  'species',
  'gender',
  'aproxBirthDate',
  'isSterilized',
  'lifeStage',
  'size',
  'isAvalible',
  'isAvailable',
  'isVisible',
  'isDeleted',
  'status',
  'followUpStatus',
  'waitingSince',
  'medicalConditions',
  'vaccinations',
  'notes',
  'contactName',
  'contacts',
  'totalCost',
  'images',
  'mainImageUrl',
  'bannerImage',
  'compatibility',
  'litterId',
  'litterName',
  'adoptionFormId',
  'adoptionFormName',
  'eventPdfs',
]);

function formatValue(value: unknown): string {
  if (value === null) return '(vacío)';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Renders any fields in the list that are not explicitly handled above.
 * Acts as a safety net so new or obscure fields always show up in the timeline.
 */
function FallbackKeys({ list }: { list: beforeAfterType }): React.ReactElement {
  const unhandled = (Object.keys(list) as (keyof beforeAfterType)[]).filter(
    (k) => !HANDLED_KEYS.has(k) && list[k] !== undefined
  );

  if (unhandled.length === 0) return <></>;

  return (
    <>
      {unhandled.map((key) => (
        <li key={String(key)} className="font-semibold">
          {' '}
          {String(key)}: <span className="font-normal">{formatValue(list[key])}</span>
        </li>
      ))}
    </>
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
          Responsable del caso:{' '}
          <span className="font-normal">
            {Array.isArray(list.caseManager)
              ? list.caseManager.join(', ')
              : String(list.caseManager)}
          </span>
        </li>
      )}
      {list.followUpManager !== undefined && (
        <li className="font-semibold">
          {' '}
          Resp. seguimiento:{' '}
          <span className="font-normal">
            {Array.isArray(list.followUpManager)
              ? list.followUpManager.join(', ')
              : String(list.followUpManager)}
          </span>
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
      {list.newName !== undefined && (
        <li className="font-semibold">
          {' '}
          Nombre adoptante: <span className="font-normal">{list.newName || '(vacío)'}</span>
        </li>
      )}
      {list.litterId !== undefined && (
        <li className="font-semibold">
          {' '}
          ID camada: <span className="font-normal">{list.litterId}</span>
        </li>
      )}
      {list.litterName !== undefined && (
        <li className="font-semibold">
          {' '}
          Camada: <span className="font-normal">{list.litterName}</span>
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
      {list.compatibility !== undefined && (
        <li className="font-semibold">
          {' '}
          Compatibilidad: <span className="font-normal">{formatValue(list.compatibility)}</span>
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
      {/*Note: isAvalible is a typo (should be isAvailable), kept for backward compatibility with existing database records*/}
      {list.isAvalible !== undefined && (
        <li className="font-semibold">
          Estado:{' '}
          <span className="font-normal">{`${list.isAvalible ? 'Disponible' : 'No disponible'}`}</span>
        </li>
      )}
      {list.isAvailable !== undefined && (
        <li className="font-semibold">
          Estado:{' '}
          <span className="font-normal">{`${list.isAvailable ? 'Disponible' : 'No disponible'}`}</span>
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
      {list.followUpStatus !== undefined && (
        <li className="font-semibold">
          {' '}
          Estado seguimiento:{' '}
          <span className="font-normal">
            {list.followUpStatus === 'active' ? 'Activo' : 'Cerrado'}
          </span>
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
            {contact.label ? `${contact.label} (${contact.type})` : contact.type}:{' '}
            <span className="font-normal">{contact.value}</span>
          </li>
        ))}
      {list.adoptionFormName !== undefined && (
        <li className="font-semibold">
          {' '}
          Formulario adopción:{' '}
          {list.adoptionFormId ? (
            <Link
              href={`/plam-admin/formularios/${list.adoptionFormId}`}
              className="text-green-600 hover:text-green-800 underline font-normal"
            >
              {list.adoptionFormName || 'Ver formulario'} →
            </Link>
          ) : (
            <span className="font-normal">{list.adoptionFormName}</span>
          )}
        </li>
      )}
      {list.totalCost !== undefined && (
        <li className="font-semibold">
          {' '}
          Costo total acumulado:{' '}
          <span className="font-semibold text-red-500">${list.totalCost}</span>
        </li>
      )}
      {list.mainImageUrl !== undefined && (
        <li className="font-semibold">
          {' '}
          Imagen principal:{' '}
          <img
            src={list.mainImageUrl || '/logo300.webp'}
            alt="Imagen principal"
            className="w-16 h-16 object-cover rounded border"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = 'true';
                img.src = '/logo300.webp';
              }
            }}
          />
        </li>
      )}
      {list.bannerImage !== undefined && (
        <li className="font-semibold">
          {' '}
          Banner: <span className="font-normal">{formatValue(list.bannerImage)}</span>
        </li>
      )}
      {list.images && list.images.length > 0 && (
        <li className="font-semibold flex flex-col gap-1">
          <span>Imágenes:</span>
          <div className="flex gap-1">
            {list.images.map((image) => (
              <Image
                key={image.imgId}
                src={image.imgUrl || '/logo300.webp'}
                alt={image.imgAlt}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded border"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = 'true';
                    img.src = '/logo300.webp';
                  }
                }}
              />
            ))}
          </div>
        </li>
      )}
      <FallbackKeys list={list} />
    </ul>
  );
}
