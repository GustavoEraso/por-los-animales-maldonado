import type { ChangeEvent } from 'react';

interface AnimalDataControlsProps {
  isLitterShareActive: boolean;
  someCompatibility: boolean;
  animalDataToShow: Record<string, boolean>;
  nameSize: number;
  itemsSize: number;
  infoText: string;
  onAnimalDataToShowChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNameSizeChange: (value: number) => void;
  onItemsSizeChange: (value: number) => void;
  onInfoTextChange: (value: string) => void;
}

/**
 * Controls which animal fields are visible in the individual poster mode.
 * This panel is disabled when litter mode is active.
 *
 * @example
 * <AnimalDataControls
 *   isLitterShareActive={isLitterShareActive}
 *   someCompatibility={someCompatibility}
 *   animalDataToShow={animalDataToShow}
 *   nameSize={nameSize}
 *   itemsSize={itemsSize}
 *   infoText={infoText}
 *   onAnimalDataToShowChange={handleAnimalDataToShow}
 *   onNameSizeChange={setNameSize}
 *   onItemsSizeChange={setItemsSize}
 *   onInfoTextChange={setInfoText}
 * />
 */
export default function AnimalDataControls({
  isLitterShareActive,
  someCompatibility,
  animalDataToShow,
  nameSize,
  itemsSize,
  infoText,
  onAnimalDataToShowChange,
  onNameSizeChange,
  onItemsSizeChange,
  onInfoTextChange,
}: AnimalDataControlsProps) {
  return (
    <section
      className={`flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50 ${
        isLitterShareActive ? 'opacity-60' : ''
      }`}
    >
      <div className="space-y-3">
        <h3 className="leading-none font-semibold text-2xl">Datos del animal</h3>

        {isLitterShareActive && (
          <p className="text-sm text-gray-700">
            En modo camada, estos datos no se muestran en la placa grupal. Cambia a modo individual
            para usarlos.
          </p>
        )}

        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300 ">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center ">
            <span>Nombre:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.name}
              name="name"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label htmlFor="nameSize">Tamaño del nombre: </label>
          <span className="text-center">{nameSize}px</span>
          <input
            type="range"
            id="nameSize"
            min="10"
            max="50"
            value={nameSize}
            onChange={(e) => onNameSizeChange(Number(e.target.value))}
            className="w-full"
            disabled={isLitterShareActive}
          />
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Genero:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.gender}
              name="gender"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Edad aprox:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.aproxBirthDate}
              name="aproxBirthDate"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Etapa de vida:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.lifeStage}
              name="lifeStage"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Tamaño:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.size}
              name="size"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Esterilizado:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.isSterilized}
              name="isSterilized"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
            <span>Disponinilidad para adoptar:</span>
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={animalDataToShow.isAvailable}
              name="isAvailable"
              onChange={onAnimalDataToShowChange}
              disabled={isLitterShareActive}
            />
            <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
          </label>
        </div>
        {someCompatibility && (
          <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
            <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center">
              <span>Compatibilidad:</span>
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={!someCompatibility ? false : animalDataToShow.compatibility}
                name="compatibility"
                onChange={onAnimalDataToShowChange}
                disabled={!someCompatibility || isLitterShareActive}
              />
              <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
            </label>
          </div>
        )}
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md">
          <label className="flex items-center justify-between">
            <textarea
              placeholder="descripción corta"
              onChange={(e) => onInfoTextChange(e.target.value)}
              className="font-medium text-gray-900 outline-0 w-full field-sizing-content"
              value={infoText}
              disabled={isLitterShareActive}
            ></textarea>
          </label>
        </div>
        <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300">
          <label htmlFor="itemsSize">Tamaño de items: </label>
          <span className="text-center">{itemsSize}px</span>
          <input
            type="range"
            id="itemsSize"
            min="10"
            max="50"
            value={itemsSize}
            onChange={(e) => onItemsSizeChange(Number(e.target.value))}
            className="w-full"
            disabled={isLitterShareActive}
          />
        </div>
      </div>
    </section>
  );
}
