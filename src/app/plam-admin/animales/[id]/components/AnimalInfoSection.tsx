import PhotoCarrousel from '@/components/PhotoCarrousel';
import { Animal } from '@/types';
import { formatDateMMYYYY, yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { YesNoUnknownMap } from '@/lib/constants/animalLabels';
import { Img } from '@/types';

interface AnimalInfoSectionProps {
  animal: Animal;
  images: Img[];
}

/**
 * Displays the basic animal information (description, status, gender, species, etc.)
 * alongside the photo carousel.
 */
export default function AnimalInfoSection({
  animal,
  images,
}: AnimalInfoSectionProps): React.ReactElement {
  const {
    description,
    isAvailable,
    isVisible,
    gender,
    aproxBirthDate,
    status,
    size,
    species,
    waitingSince,
    compatibility,
    isSterilized,
  } = animal;

  return (
    <section className="flex flex-col md:flex-row gap-4 py-4 w-full justify-center items-center">
      <div className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full max-w-7xl">
        <div className="flex flex-col gap-4 text-start text-black px-2 md:w-1/2 shrink-0">
          <textarea
            className="text-green-dark text-lg font-bold field-sizing-content resize-none"
            value={description}
            readOnly
            aria-label="Descripción del animal"
            disabled
          />
          <ul className="list-disc pl-4 text-green-dark">
            <li className="text-xl font-semibold">
              Estado: <span className="font-normal">{status}</span>
            </li>
            <li className="text-xl font-semibold">
              Disponible: <span className="font-normal">{isAvailable ? 'Sí' : 'No'}</span>
            </li>
            <li className="text-xl font-semibold">
              Se muestra: <span className="font-normal">{isVisible ? 'Sí' : 'No'}</span>
            </li>
            <li className="text-xl font-semibold">
              Género: <span className="font-normal">{gender}</span>
            </li>
            <li className="text-xl font-semibold">
              Especie: <span className="font-normal">{species}</span>
            </li>
            <li className="text-xl font-semibold">
              Tamaño: <span className="font-normal">{size}</span>
            </li>
            <li className="text-xl font-semibold">
              Situación actual: <span className="font-normal">{status}</span>
            </li>
            <li className="text-xl font-semibold">
              Edad: <span className="font-normal">{yearsOrMonthsElapsed(aproxBirthDate)}</span>
            </li>
            <li className="text-xl font-semibold">
              Esperándo desde:{' '}
              <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${yearsOrMonthsElapsed(waitingSince)})`}</span>
            </li>
            <li className="text-xl font-semibold">
              Está esterilizado:{' '}
              <span className="font-normal">{YesNoUnknownMap[isSterilized]}</span>
            </li>
            <li>
              <span className="text-xl font-semibold">Compatibilidad:</span>
              <ul className="list-disc pl-4 ">
                <li>
                  {' '}
                  <span className="font-semibold">Con perros:</span>{' '}
                  {YesNoUnknownMap[compatibility?.dogs]}
                </li>
                <li>
                  <span className="font-semibold">Con gatos:</span>{' '}
                  {YesNoUnknownMap[compatibility?.cats]}
                </li>
                <li>
                  <span className="font-semibold">Con niños:</span>{' '}
                  {YesNoUnknownMap[compatibility?.kids]}
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/2 h-auto max-h-[650px] rounded-lg bg-amber-sunset shrink-0">
          <PhotoCarrousel images={images} />
        </div>
      </div>
    </section>
  );
}
