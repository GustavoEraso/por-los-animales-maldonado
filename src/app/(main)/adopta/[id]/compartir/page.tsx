'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

import { fetchAnimals } from '@/lib/fetchAnimal';
import { fetchContacts } from '@/lib/fetchContacts';
import { handleToast } from '@/lib/handleToast';

import { Animal, WpContactType } from '@/types';
import Loader from '@/components/Loader';
import LitterModeControls from './components/LitterModeControls';
import AnimalDataControls from './components/AnimalDataControls';
import ColorSchemeControls from './components/ColorSchemeControls';
import FormatControls from './components/FormatControls';
import TitleControls from './components/TitleControls';
import SharePreview from './components/SharePreview';
// import { CheckIcon } from '@/components/Icons';

interface ColorScheme {
  name: string;
  primary: `#${string}`;
  secondary: `#${string}`;
  accent: `#${string}`;
  primaryText: `#${string}`; // Texto para usar sobre primary
  secondaryText: `#${string}`; // Texto para usar sobre secondary
}

const colorSchemes: ColorScheme[] = [
  {
    name: 'Cielo de Paseo',
    primary: '#7bb1df',
    secondary: '#fbf7ea',
    primaryText: '#fbf7ea',
    secondaryText: '#272727',
    accent: '#272727',
  },
  {
    name: 'Campo Soleado',
    primary: '#fbf7ea',
    secondary: '#7d9b76',
    primaryText: '#272727',
    secondaryText: '#ffffff',
    accent: '#272727',
  },
  {
    name: 'Parque Natural',
    primary: '#7d9b76',
    secondary: '#f6f6e9',
    primaryText: '#ffffff',
    secondaryText: '#7d9b76',
    accent: '#272727',
  },
  {
    name: 'Bosque Otoñal',
    primary: '#f78785',
    secondary: '#503530',
    primaryText: '#ede8ea',
    secondaryText: '#f78785',
    accent: '#503530',
  },
  {
    name: 'Hogar Cálido',
    primary: '#f2e9e1',
    secondary: '#db9a8f',
    primaryText: '#814256',
    secondaryText: '#814256',
    accent: '#814256',
  },
];

type SimpleFormatKey = 'story' | 'square' | 'post';

interface FormatPreset {
  key: SimpleFormatKey;
  label: string;
  width: number; // px
  height: number; // px
}

type ShareMode = 'individual' | 'litter';
type LitterRowsMode = 'auto' | '1' | '2' | '3' | '4' | '5' | '6';

function getAutoLitterRows(animalCount: number): number {
  if (animalCount <= 0) {
    return 1;
  }

  if (animalCount === 2) {
    return 1;
  }

  if (animalCount === 3) {
    return 1;
  }

  if (animalCount === 4) {
    return 2;
  }

  if (animalCount === 5 || animalCount === 6) {
    return 2;
  }

  if (animalCount === 7) {
    return 3;
  }

  if (animalCount === 8) {
    return 2;
  }

  return 3;
}

async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = url;
        })
    )
  );
}

const formatPresets: FormatPreset[] = [
  // { key: 'square', label: 'Cuadrado (1:1)', width: 324, height: 324, },
  { key: 'post', label: 'Post vertical (3:4)', width: 324, height: 432 },
  { key: 'story', label: 'Historia (9:16)', width: 324, height: 576 },
];

const titles = ['EN ADOPCIóN RESPONSABLE', 'NECESITA TRANSITORIO', 'NECESITA TU AYUDA'];
const MIN_LOADING_TIME = 600;

export default function CompartirPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CompartirContain />
    </Suspense>
  );
}
function CompartirContain() {
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const [contacts, setContacts] = useState<WpContactType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [litterAnimals, setLitterAnimals] = useState<Animal[]>([]);
  const [shareMode, setShareMode] = useState<ShareMode>('individual');
  const [includeUnavailableInLitter, setIncludeUnavailableInLitter] = useState(false);
  const [litterRowsMode, setLitterRowsMode] = useState<LitterRowsMode>('auto');
  const [selectedLitterAnimalIds, setSelectedLitterAnimalIds] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const [animal, setAnimal] = useState<Animal | null>(null);

  const [nameSize, setNameSize] = useState(30);
  const [titleSize, setTitleSize] = useState(30);
  const [itemsSize, setItemsSize] = useState(20);

  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [selectedFormat, setSelectedFormat] = useState<FormatPreset>(formatPresets[0]);
  const [selectedTitle, setSelectedTitle] = useState(titles[0]);
  const [infoText, setInfoText] = useState('');

  const initialAnimalDataToShow = {
    name: true,
    gender: true,
    aproxBirthDate: true,
    lifeStage: true,
    size: false,
    compatibility: true,
    isSterilized: false,
    isAvailable: false,
  };

  const [animalDataToShow, setAnimalDataToShow] =
    useState<Record<string, boolean>>(initialAnimalDataToShow);

  const handleAnimalDataToShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.name;
    const checked = e.currentTarget.checked;

    setAnimalDataToShow((prev) => ({ ...prev, [key]: checked }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const startTime = Date.now();
      setLoading(true);

      try {
        // Ejecutar ambas peticiones en paralelo
        const [fetchedAnimal, fetchedContacts] = await Promise.all([
          fetchAnimals({ id }).then((result) => result[0]),
          fetchContacts(),
        ]);

        if (!isMounted) return;

        if (!fetchedAnimal) {
          setAnimal(null);
          setLitterAnimals([]);
          return;
        }

        setAnimal(fetchedAnimal);
        setContacts(fetchedContacts);

        if (fetchedAnimal?.litterId) {
          const fetchedLitterResponse = await fetchAnimals({
            litterId: fetchedAnimal.litterId,
            sortBy: 'name',
            sortOrder: 'asc',
          });
          const fetchedLitter = Array.isArray(fetchedLitterResponse)
            ? fetchedLitterResponse
            : fetchedLitterResponse.data;
          setLitterAnimals(fetchedLitter);
        } else {
          setLitterAnimals([]);
        }

        // Establecer contactos seleccionados por defecto
        if (fetchedContacts.length > 0) {
          const defaultSelection = fetchedContacts.length >= 2 ? [0, 1] : [0];
          setSelectedContacts(defaultSelection);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          handleToast({
            type: 'error',
            title: 'No pudimos cargar los datos',
            text: 'Intenta recargar la página para volver a intentarlo.',
          });
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, remaining);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const canUseLitterMode = useMemo(() => {
    return litterAnimals.length > 1;
  }, [litterAnimals]);

  useEffect(() => {
    if (!canUseLitterMode && shareMode === 'litter') {
      setShareMode('individual');
    }
  }, [canUseLitterMode, shareMode]);

  const visibleLitterAnimals = useMemo(() => {
    const filteredAnimals = includeUnavailableInLitter
      ? litterAnimals
      : litterAnimals.filter((litterAnimal) => litterAnimal.isAvailable !== false);

    const selectedIdsSet = new Set(selectedLitterAnimalIds);

    const manuallySelectedAnimals = filteredAnimals.filter((animalItem) =>
      selectedIdsSet.has(animalItem.id)
    );

    const sortedAnimals = [...manuallySelectedAnimals].sort((a, b) => {
      const availabilityA = a.isAvailable === false ? 1 : 0;
      const availabilityB = b.isAvailable === false ? 1 : 0;

      if (availabilityA !== availabilityB) return availabilityA - availabilityB;

      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return sortedAnimals;
  }, [includeUnavailableInLitter, litterAnimals, selectedLitterAnimalIds]);

  const selectableLitterAnimals = useMemo(() => {
    return includeUnavailableInLitter
      ? litterAnimals
      : litterAnimals.filter((litterAnimal) => litterAnimal.isAvailable !== false);
  }, [includeUnavailableInLitter, litterAnimals]);

  useEffect(() => {
    const selectableIds = selectableLitterAnimals.map((animalItem) => animalItem.id);

    setSelectedLitterAnimalIds((prev) => {
      if (selectableIds.length === 0) return [];

      if (prev.length === 0) {
        return selectableIds;
      }

      const prevSet = new Set(prev);
      const preserved = prev.filter((id) => selectableIds.includes(id));
      const newOnes = selectableIds.filter((id) => !prevSet.has(id));

      return [...preserved, ...newOnes];
    });
  }, [selectableLitterAnimals]);

  const handleToggleLitterAnimal = (animalId: string) => {
    setSelectedLitterAnimalIds((prev) => {
      if (prev.includes(animalId)) {
        return prev.filter((id) => id !== animalId);
      }

      return [...prev, animalId];
    });
  };

  const litterRowCount = useMemo(() => {
    if (litterRowsMode === 'auto') {
      return getAutoLitterRows(visibleLitterAnimals.length);
    }

    return Number.parseInt(litterRowsMode, 10);
  }, [litterRowsMode, visibleLitterAnimals.length]);

  const visibleLitterAnimalsInGrid = visibleLitterAnimals;

  const litterNameTextClass = useMemo(() => {
    if (visibleLitterAnimalsInGrid.length >= 7) return 'text-[10px]';
    if (visibleLitterAnimalsInGrid.length >= 5) return 'text-xs';
    return 'text-sm';
  }, [visibleLitterAnimalsInGrid.length]);

  const isLitterShareActive = shareMode === 'litter' && canUseLitterMode;

  // const handleContactToggle = (contactIndex: number) => {
  //   setSelectedContacts((prev) => {
  //     if (prev.includes(contactIndex)) {
  //       // Si ya está seleccionado, lo removemos
  //       return prev.filter((index) => index !== contactIndex);
  //     } else {
  //       // Si no está seleccionado, lo agregamos
  //       return [...prev, contactIndex].sort(); // Sort para mantener orden
  //     }
  //   });
  // };

  // ---- Imágenes del animal ----------------------------

  const currentImages = useMemo<string[]>(() => {
    return animal?.images?.map((img) => img.imgUrl) || [];
  }, [animal]);

  const areaRef = useRef<HTMLDivElement>(null);

  // ---- Captura con html2canvas ----------------------------
  const capturar = async () => {
    if (!areaRef.current || !animal?.id || isCapturing) return;

    if (isLitterShareActive && visibleLitterAnimalsInGrid.length === 0) {
      handleToast({
        type: 'warning',
        title: 'No hay integrantes para exportar',
        text: 'Ajusta los filtros de camada antes de descargar la placa.',
      });
      return;
    }

    setIsCapturing(true);

    try {
      if (isLitterShareActive) {
        const litterImageUrls = visibleLitterAnimalsInGrid.map(
          (litterAnimal) => litterAnimal.images?.[0]?.imgUrl || '/logo300.webp'
        );

        await preloadImages(litterImageUrls);
      }

      const html2canvas = (await import('html2canvas-pro')).default;

      const canvas = await html2canvas(areaRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg');
      link.download = isLitterShareActive
        ? `${animal.litterName || animal.id}-camada.jpeg`
        : `${animal.id}.jpeg`;
      link.click();
    } catch (error) {
      console.error(error);
      handleToast({
        type: 'error',
        title: 'No se pudo descargar la placa',
        text: 'Ocurrió un error al generar la imagen. Intenta nuevamente.',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const someCompatibility = useMemo(() => {
    if (!animal?.id) return false;

    return Object.values(animal.compatibility).includes('si');
  }, [animal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-light to-amber-sunset">
        <Loader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1 sm:p-8">
          <aside className="flex flex-col gap-6 lg:col-span-1 w-full">
            <section className="flex flex-col h-96 gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm ">
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
            </section>
            <section className="flex flex-col h-96 gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm ">
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
              <div className="skeleton w-full h-16 rounded outline outline-amber-sunset" />
            </section>
          </aside>

          <main className="lg:col-span-2 flex flex-col gap-8 items-center w-full rounded-xl border border-amber-sunset shadow-sm  p-16">
            <section className="flex flex-col gap-3 items-center sticky top-2">
              <div className="skeleton flex flex-col items-center w-80 h-96 overflow-hidden select-none outline outline-amber-sunset rounded" />
              <div className="skeleton text-transparent px-4 py-2 rounded">cargando...</div>
            </section>
          </main>
        </div>
      </div>
    );
  }
  if (!animal?.id) {
    return (
      <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
        <h1 className="text-2xl font-bold">ups parece que no encontramos el animal...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-light to-amber-sunset">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1 sm:p-8">
        <aside className="flex flex-col gap-6 lg:col-span-1 w-full">
          <LitterModeControls
            shareMode={shareMode}
            canUseLitterMode={canUseLitterMode}
            includeUnavailableInLitter={includeUnavailableInLitter}
            litterRowsMode={litterRowsMode}
            visibleLitterCount={visibleLitterAnimalsInGrid.length}
            totalLitterCount={litterAnimals.length}
            selectableLitterAnimals={selectableLitterAnimals}
            selectedLitterAnimalIds={selectedLitterAnimalIds}
            onShareModeChange={setShareMode}
            onIncludeUnavailableChange={setIncludeUnavailableInLitter}
            onLitterRowsModeChange={setLitterRowsMode}
            onToggleLitterAnimal={handleToggleLitterAnimal}
          />

          <ColorSchemeControls
            colorSchemes={colorSchemes}
            selectedColorSchemeName={selectedColorScheme.name}
            onSelectColorScheme={(schemeName) => {
              const scheme = colorSchemes.find((item) => item.name === schemeName);
              if (scheme) {
                setSelectedColorScheme(scheme);
              }
            }}
          />

          <FormatControls
            formatPresets={formatPresets}
            selectedFormatKey={selectedFormat.key}
            onSelectFormat={(formatKey) => {
              const format = formatPresets.find((item) => item.key === formatKey);
              if (format) {
                setSelectedFormat(format);
              }
            }}
          />

          <TitleControls
            titles={titles}
            selectedTitle={selectedTitle}
            titleSize={titleSize}
            onSelectTitle={setSelectedTitle}
            onTitleSizeChange={setTitleSize}
          />

          <AnimalDataControls
            isLitterShareActive={isLitterShareActive}
            someCompatibility={someCompatibility}
            animalDataToShow={animalDataToShow}
            nameSize={nameSize}
            itemsSize={itemsSize}
            infoText={infoText}
            onAnimalDataToShowChange={handleAnimalDataToShow}
            onNameSizeChange={setNameSize}
            onItemsSizeChange={setItemsSize}
            onInfoTextChange={setInfoText}
          />
          {/* <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
            <div className="space-y-3">
              <h3 className="leading-none font-semibold text-2xl">Contactos a mostrar</h3>
              <p className="text-sm text-gray-600">
                Selecciona uno o más contactos para mostrar en la imagen
              </p>
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedContacts.includes(index)
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                  onClick={() => handleContactToggle(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{contact.name}</span>
                      <span className="text-sm text-gray-600">
                        {formatPhone({ countryCode: contact.countryCode, phone: contact.phone })}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedContacts.includes(index)
                          ? 'bg-red-600 border-red-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedContacts.includes(index) && <CheckIcon size={12} color="white" />}
                    </div>
                  </div>
                </div>
              ))}

           
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedContacts(contacts.map((_, index) => index))}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Seleccionar todos
                </button>
                <button
                  onClick={() => setSelectedContacts([])}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Deseleccionar todos
                </button>
              </div>
            </div>
          </section> */}
        </aside>

        <main className="lg:col-span-2 flex flex-col gap-8 items-center w-full rounded-xl border border-amber-sunset  shadow-sm bg-amber-50 p-16">
          <section className="flex flex-col gap-3 items-center sticky top-2 ">
            {/* Área que se captura */}
            <SharePreview
              areaRef={areaRef}
              selectedFormat={selectedFormat}
              selectedColorScheme={selectedColorScheme}
              selectedTitle={selectedTitle}
              titleSize={titleSize}
              isLitterShareActive={isLitterShareActive}
              visibleLitterAnimals={visibleLitterAnimalsInGrid}
              litterAnimalsCount={litterAnimals.length}
              litterGridRows={litterRowCount}
              litterNameTextClass={litterNameTextClass}
              animal={animal}
              animalDataToShow={animalDataToShow}
              nameSize={nameSize}
              itemsSize={itemsSize}
              infoText={infoText}
              someCompatibility={someCompatibility}
              currentImages={currentImages}
              selectedContacts={selectedContacts}
              contacts={contacts}
            />

            {/* Botón descarga */}
            <button
              onClick={capturar}
              disabled={isCapturing}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCapturing ? 'Generando...' : 'Descargar'}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
