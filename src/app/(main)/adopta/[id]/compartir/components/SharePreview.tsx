import type { RefObject } from 'react';
import NextImage from 'next/image';
import QRCode from 'react-qr-code';

import { yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { formatPhone } from '@/lib/formatPhone';
import AdjustableImage from '@/elements/AdjustableImage';
import type { Animal, WpContactType } from '@/types';

import LitterGridSection from './LitterGridSection';

interface ColorSchemeProps {
  primary: `#${string}`;
  secondary: `#${string}`;
  accent: `#${string}`;
  primaryText: `#${string}`;
  secondaryText: `#${string}`;
}

interface FormatPresetProps {
  key: 'story' | 'square' | 'post';
  width: number;
  height: number;
}

interface SharePreviewProps {
  areaRef: RefObject<HTMLDivElement | null>;
  selectedFormat: FormatPresetProps;
  selectedColorScheme: ColorSchemeProps;
  selectedTitle: string;
  titleSize: number;
  isLitterShareActive: boolean;
  visibleLitterAnimals: Animal[];
  litterAnimalsCount: number;
  litterGridRows: number;
  litterNameTextClass: string;
  animal: Animal;
  animalDataToShow: Record<string, boolean>;
  nameSize: number;
  itemsSize: number;
  infoText: string;
  someCompatibility: boolean;
  currentImages: string[];
  selectedContacts: number[];
  contacts: WpContactType[];
}

/**
 * Renders the full poster preview that is captured and downloaded.
 * Supports both individual and litter layouts while preserving footer contacts and QR.
 *
 * @example
 * <SharePreview
 *   areaRef={areaRef}
 *   selectedFormat={selectedFormat}
 *   selectedColorScheme={selectedColorScheme}
 *   selectedTitle={selectedTitle}
 *   titleSize={titleSize}
 *   isLitterShareActive={isLitterShareActive}
 *   visibleLitterAnimals={visibleLitterAnimals}
 *   litterAnimalsCount={litterAnimals.length}
 *   litterGridRows={litterGridRows}
 *   litterNameTextClass={litterNameTextClass}
 *   animal={animal}
 *   animalDataToShow={animalDataToShow}
 *   nameSize={nameSize}
 *   itemsSize={itemsSize}
 *   infoText={infoText}
 *   someCompatibility={someCompatibility}
 *   currentImages={currentImages}
 *   selectedContacts={selectedContacts}
 *   contacts={contacts}
 * />
 */
export default function SharePreview({
  areaRef,
  selectedFormat,
  selectedColorScheme,
  selectedTitle,
  titleSize,
  isLitterShareActive,
  visibleLitterAnimals,
  litterGridRows,
  litterNameTextClass,
  animal,
  animalDataToShow,
  nameSize,
  itemsSize,
  infoText,
  someCompatibility,
  currentImages,
  selectedContacts,
  contacts,
}: SharePreviewProps) {
  return (
    <div
      ref={areaRef}
      style={{ height: selectedFormat.height, width: selectedFormat.width }}
      className="flex flex-col items-center  overflow-hidden select-none shadow-[0px_0px_15px_#000000] "
    >
      <section
        style={{
          backgroundColor: selectedColorScheme.primary,
          color: selectedColorScheme.primaryText,
        }}
        className="flex felx-col items-center justify-center w-full "
      >
        <h3
          style={{ fontSize: `${titleSize}px` }}
          className={` w-full  text-center text-balance font-extrabold leading-none uppercase ${selectedFormat.key === 'story' ? ' py-4' : 'py-1'} `}
        >
          {selectedTitle}
        </h3>
      </section>

      {isLitterShareActive ? (
        <LitterGridSection
          animals={visibleLitterAnimals}
          rows={litterGridRows}
          nameTextClass={litterNameTextClass}
          secondaryBgColor={selectedColorScheme.secondary}
          secondaryTextColor={selectedColorScheme.secondaryText}
        />
      ) : (
        <section
          style={{
            backgroundColor: selectedColorScheme.secondary,
            color: selectedColorScheme.secondaryText,
          }}
          className=" relative grid grid-cols-7 bg-green-forest text-cream-light w-full overflow-hidden flex-1 min-h-0"
        >
          <div
            className={`col-span-3  flex flex-col items-stretch justify-around p-1 relative overflow-hidden ${selectedFormat.key === 'story' ? 'py-8' : ''}`}
          >
            {animalDataToShow.name && (
              <h3
                className="break-words font-bold uppercase text-center leading-none"
                style={{ fontSize: `${nameSize}px` }}
              >
                {animal.name || 'Nombre no disponible.'}
              </h3>
            )}

            <ul
              style={{ fontSize: `${itemsSize}px` }}
              className="flex flex-col h-full justify-around"
            >
              {animalDataToShow.gender && <li className="capitalize"> {animal.gender}</li>}
              {animalDataToShow.aproxBirthDate && (
                <li className="capitalize"> {yearsOrMonthsElapsed(animal.aproxBirthDate)}</li>
              )}
              {animalDataToShow.size && <li className="capitalize"> {animal.size}</li>}
              {animalDataToShow.lifeStage && <li className="capitalize"> {animal.lifeStage}</li>}
              {animalDataToShow.isAvailable && (
                <li className="text-balance leading-none">
                  {animal.isAvailable ? 'Pronto para encontrar hogar' : 'En recuperación'}
                </li>
              )}
              {animalDataToShow.isSterilized && (
                <li className="text-balance leading-none">
                  {animal.isSterilized === 'si' && 'Esterilizado'}
                  {animal.isSterilized === 'no' && 'Sin esterelizar'}
                  {animal.isSterilized === 'no_se' && 'No sabemos si esta esterilizado'}
                </li>
              )}
            </ul>

            <div className="py-2">
              {((animalDataToShow.compatibility && someCompatibility) || infoText !== '') && (
                <p className="border-b-2 mb-1">+info</p>
              )}
              <p className="leading-none max-w-full break-words">{infoText}</p>

              {animalDataToShow.compatibility && someCompatibility && (
                <div className="flex flex-col">
                  <p className="font-semibold text-sm">se lleva bien con:</p>
                  <div className="flex gap-1 text-2xl justify-center">
                    {animal.compatibility.dogs === 'si' && <span>🐶 </span>}
                    {animal.compatibility.cats === 'si' && <span>🐱 </span>}
                    {animal.compatibility.kids === 'si' && <span>👶 </span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 overflow-hidden min-h-0">
            <AdjustableImage
              imageUrls={currentImages}
              width="100%"
              height="100%"
              className="text-green-dark"
            />
          </div>
        </section>
      )}

      <footer
        style={{ backgroundColor: selectedColorScheme.accent }}
        className="relative flex flex-col w-full pb-1"
      >
        <div
          style={{
            backgroundColor: selectedColorScheme.primary,
            color: selectedColorScheme.primaryText,
          }}
          className="relative w-full flex items-center justify-around p-1"
        >
          <NextImage
            src="/logo300.webp"
            alt="Logo de Adopta"
            width={80}
            height={80}
            priority
            className="object-contain shrink-0"
          />
          {selectedContacts.length > 0 && (
            <div className="flex flex-col gap-0.5 items-center justify-around">
              <p className="text-sm text-center font-bold">
                Contacto{`${selectedContacts.length > 1 ? 's:' : ':'}`}
              </p>

              {selectedContacts.map((contactIndex) => {
                const contact = contacts[contactIndex];
                if (!contact) return null;

                return (
                  <div key={contact.phone} className="flex flex-col gap-0.5 items-center">
                    <p className="text-green-dark text-sm text-center font-bold bg-cream-light px-1 rounded">
                      {formatPhone({
                        countryCode: contact.countryCode,
                        phone: contact.phone,
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <QRCode
            value={`www.porlosanimalesmaldonado.org/adopta/${animal.id}`}
            size={60}
            level="H"
          />
        </div>
        <p className="text-xs text-cream-light text-center">
          {`porlosanimalesmaldonado.org/adopta/${animal.id}`}
        </p>
      </footer>
    </div>
  );
}
