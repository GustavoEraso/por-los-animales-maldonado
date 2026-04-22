interface LitterModeControlsProps {
  shareMode: 'individual' | 'litter';
  canUseLitterMode: boolean;
  includeUnavailableInLitter: boolean;
  litterRowsMode: 'auto' | '1' | '2' | '3' | '4' | '5' | '6';
  visibleLitterCount: number;
  totalLitterCount: number;
  selectableLitterAnimals: Array<{
    id: string;
    name: string;
    isAvailable?: boolean;
  }>;
  selectedLitterAnimalIds: string[];
  onShareModeChange: (mode: 'individual' | 'litter') => void;
  onIncludeUnavailableChange: (value: boolean) => void;
  onLitterRowsModeChange: (mode: 'auto' | '1' | '2' | '3' | '4' | '5' | '6') => void;
  onToggleLitterAnimal: (animalId: string) => void;
}

function parseLitterGridMode(value: string): 'auto' | '1' | '2' | '3' | '4' | '5' | '6' {
  if (value === '1') return '1';
  if (value === '2') return '2';
  if (value === '3') return '3';
  if (value === '4') return '4';
  if (value === '5') return '5';
  if (value === '6') return '6';
  return 'auto';
}

/**
 * Controls for switching between individual and litter share posters.
 * Includes litter-specific filters and limits when litter mode is active.
 *
 * @example
 * <LitterModeControls
 *   shareMode={shareMode}
 *   canUseLitterMode={canUseLitterMode}
 *   includeUnavailableInLitter={includeUnavailableInLitter}
 *   litterRowsMode={litterRowsMode}
 *   visibleLitterCount={visibleLitterAnimals.length}
 *   totalLitterCount={litterAnimals.length}
 *   onShareModeChange={setShareMode}
 *   onIncludeUnavailableChange={setIncludeUnavailableInLitter}
 *   onLitterRowsModeChange={setLitterRowsMode}
 * />
 */
export default function LitterModeControls({
  shareMode,
  canUseLitterMode,
  includeUnavailableInLitter,
  litterRowsMode,
  visibleLitterCount,
  totalLitterCount,
  selectableLitterAnimals,
  selectedLitterAnimalIds,
  onShareModeChange,
  onIncludeUnavailableChange,
  onLitterRowsModeChange,
  onToggleLitterAnimal,
}: LitterModeControlsProps) {
  return (
    <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
      <div className="space-y-3">
        <h3 className="leading-none font-semibold text-2xl">Modo de placa</h3>

        <div
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            shareMode === 'individual'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
          onClick={() => onShareModeChange('individual')}
        >
          <span className="font-medium text-gray-900">Individual</span>
        </div>

        <div
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            shareMode === 'litter'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          } ${!canUseLitterMode ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (canUseLitterMode) {
              onShareModeChange('litter');
            }
          }}
        >
          <span className="font-medium text-gray-900">Camada (cuadrícula)</span>
        </div>

        {!canUseLitterMode && (
          <p className="text-sm text-amber-700">
            Este animal no tiene suficientes hermanos de camada para generar una placa grupal.
          </p>
        )}

        {shareMode === 'litter' && canUseLitterMode && (
          <div className="flex flex-col gap-3 p-3 rounded-lg border-2 border-gray-200">
            <label className="flex items-center justify-between font-bold text-balance gap-3">
              <span>Incluir no disponibles</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includeUnavailableInLitter}
                onChange={(e) => onIncludeUnavailableChange(e.target.checked)}
              />
              <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-sunset" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-semibold">Filas</span>
              <select
                value={litterRowsMode}
                onChange={(e) => onLitterRowsModeChange(parseLitterGridMode(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="auto">Automático</option>
                <option value="1">1 fila</option>
                <option value="2">2 filas</option>
                <option value="3">3 filas</option>
                <option value="4">4 filas</option>
                <option value="5">5 filas</option>
                <option value="6">6 filas</option>
              </select>
            </label>

            <p className="text-xs text-gray-600">
              Mostrando {visibleLitterCount} de {totalLitterCount} integrantes.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <p className="font-semibold">Integrantes a mostrar</p>
              <div className="max-h-52 overflow-auto rounded border border-gray-200 bg-white p-2 space-y-2">
                {selectableLitterAnimals.map((animal) => {
                  const isSelected = selectedLitterAnimalIds.includes(animal.id);

                  return (
                    <label
                      key={animal.id}
                      className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                    >
                      <span className="truncate font-medium text-gray-800">
                        {animal.name || 'Sin nombre'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleLitterAnimal(animal.id)}
                        className="checkbox checkbox-sm"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
