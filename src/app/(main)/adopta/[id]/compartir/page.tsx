'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import QRCode from 'react-qr-code';

import { fetchAnimals } from '@/lib/fetchAnimal';
import { fetchContacts } from '@/lib/fetchContacts';
import { yearsOrMonthsElapsed } from '@/lib/dateUtils';
import { formatPhone } from '@/lib/formatPhone';

import { Animal, WpContactType } from '@/types';
import AdjustableImage from '@/elements/AdjustableImage';
import Loader from '@/components/Loader';
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

const formatPresets: FormatPreset[] = [
  // { key: 'square', label: 'Cuadrado (1:1)', width: 324, height: 324, },
  { key: 'post', label: 'Post vertical (3:4)', width: 324, height: 432 },
  { key: 'story', label: 'Historia (9:16)', width: 324, height: 576 },
];

const titles = ['EN ADOPCIóN RESPONSABLE', 'NECESITA TRANSITORIO', 'NECESITA TU AYUDA'];

export default function Compartir() {
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const [contacts, setContacts] = useState<WpContactType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

  const [animal, setAnimal] = useState<Animal>({} as Animal);

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
    isAvalible: false,
  };

  const [animalDataToShow, setAnimalDataToShow] =
    useState<Record<string, boolean>>(initialAnimalDataToShow);

  const handleAnimalDataToShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.currentTarget.name;
    const checked = e.currentTarget.checked;

    setAnimalDataToShow((prev) => ({ ...prev, [key]: checked }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ejecutar ambas peticiones en paralelo
        const [fetchedAnimal, fetchedContacts] = await Promise.all([
          fetchAnimals({ id }).then((result) => result[0]),
          fetchContacts(),
        ]);

        setAnimal(fetchedAnimal);
        setContacts(fetchedContacts);

        // Establecer contactos seleccionados por defecto
        if (fetchedContacts.length > 0) {
          const defaultSelection = fetchedContacts.length >= 2 ? [0, 1] : [0];
          setSelectedContacts(defaultSelection);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    return animal.images?.map((img) => img.imgUrl) || [];
  }, [animal?.images]);

  const areaRef = useRef<HTMLDivElement>(null);

  // ---- Captura con html2canvas ----------------------------
  const capturar = async () => {
    if (!areaRef.current) return;
    const html2canvas = (await import('html2canvas-pro')).default;

    const canvas = await html2canvas(areaRef.current, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg');
    link.download = `${animal.id}.jpeg`;
    link.click();
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
          <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
            <div className="space-y-3">
              <h3 className="leading-none font-semibold text-2xl">Selector de colores</h3>
              {colorSchemes.map((scheme, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedColorScheme.name === scheme.name
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                  onClick={() => setSelectedColorScheme(scheme)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{scheme.name}</span>
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: scheme.secondary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: scheme.accent }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
            <div className="space-y-3">
              <h3 className="leading-none font-semibold text-2xl">Formato</h3>
              {formatPresets.map((format, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedFormat.key === format.key
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                  onClick={() => setSelectedFormat(format)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{format.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
            <div className="space-y-3">
              <h3 className="leading-none font-semibold text-2xl">Selector de título</h3>
              {titles.map((title, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTitle === title
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                  onClick={() => setSelectedTitle(title)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{title}</span>
                  </div>
                </div>
              ))}
              <div
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  !titles.some((title) => title === selectedTitle)
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <label className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Título personalizado"
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    onClick={(e) => setSelectedTitle(e.currentTarget.value)}
                    className="font-medium text-gray-900 outline-0"
                  ></input>
                </label>
              </div>
              <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300 ">
                <label htmlFor="titleSize">Tamaño del título: </label>
                <span className="text-center">{titleSize}px</span>
                <input
                  type="range"
                  id="titleSize"
                  min="10"
                  max="60"
                  value={titleSize}
                  onChange={(e) => setTitleSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-6 p-6 rounded-xl border border-amber-sunset py-6 shadow-sm bg-amber-50">
            <div className="space-y-3">
              <h3 className="leading-none font-semibold text-2xl">Datos del animal</h3>

              <div className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-red-300 ">
                <label className="flex gap-2 cursor-pointer w-fit  font-bold text-balance items-center ">
                  <span>Nombre:</span>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked={animalDataToShow.name}
                    name="name"
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                  onChange={(e) => setNameSize(Number(e.target.value))}
                  className="w-full"
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
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                    defaultChecked={animalDataToShow.isAvalible}
                    name="isAvalible"
                    onChange={(e) => handleAnimalDataToShow(e)}
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
                      disabled={!someCompatibility}
                      className="sr-only peer"
                      defaultChecked={!someCompatibility ? false : animalDataToShow.compatibility}
                      name="compatibility"
                      onChange={(e) => handleAnimalDataToShow(e)}
                    />
                    <div className="relative min-w-11 w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-dark   peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-amber-sunset peer-checked:after:bg-caramel-deep after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-amber-sunset" />
                  </label>
                </div>
              )}
              <div
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md `}
              >
                <label className="flex items-center justify-between">
                  <textarea
                    placeholder="descripción corta"
                    onChange={(e) => setInfoText(e.target.value)}
                    className="font-medium text-gray-900 outline-0 w-full field-sizing-content"
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
                  onChange={(e) => setItemsSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </section>
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
              <section
                style={{
                  backgroundColor: selectedColorScheme.secondary,
                  color: selectedColorScheme.secondaryText,
                }}
                className="flex bg-green-forest text-cream-light w-full h-full overflow-y-hidden"
              >
                {/* Seccion izquierda */}
                <div
                  className={`w-3/7 flex flex-col items-stretch justify-around  p-1 relative ${selectedFormat.key === 'story' ? 'py-8' : ''}`}
                >
                  {animalDataToShow.name && (
                    <h3
                      className={`break-words font-bold uppercase  text-center leading-none `}
                      style={{ fontSize: `${nameSize}px` }}
                    >
                      {animal.name || 'Nombre no disponible.'}
                    </h3>
                  )}

                  <ul
                    style={{ fontSize: `${itemsSize}px` }}
                    className="flex flex-col h-full justify-around p-1 "
                  >
                    {animalDataToShow.gender && <li className="  capitalize"> {animal.gender}</li>}
                    {animalDataToShow.aproxBirthDate && (
                      <li className="  capitalize">
                        {' '}
                        {yearsOrMonthsElapsed(animal.aproxBirthDate)}
                      </li>
                    )}
                    {animalDataToShow.size && <li className="  capitalize"> {animal.size}</li>}
                    {animalDataToShow.lifeStage && (
                      <li className="  capitalize"> {animal.lifeStage}</li>
                    )}
                    {animalDataToShow.isAvalible && (
                      <li className="  text-balance  leading-none">
                        {' '}
                        {animal.isAvalible ? 'Pronto para encontrar hogar' : 'En recuperación'}
                      </li>
                    )}
                    {animalDataToShow.isSterilized && (
                      <li className="  text-balance  leading-none">
                        {animal.isSterilized === 'si' && 'Esterilizado'}
                        {animal.isSterilized === 'no' && 'Sin esterelizar'}
                        {animal.isSterilized === 'no_se' && 'No sabemos si esta esterilizado'}
                      </li>
                    )}
                  </ul>
                  <div className="py-2">
                    {((animalDataToShow.compatibility && someCompatibility) || infoText !== '') && (
                      <p className="border-b-2 mb-1 ">+info</p>
                    )}
                    <p className="leading-none max-w-full break-words ">{infoText}</p>

                    {animalDataToShow.compatibility && someCompatibility && (
                      <div className=" flex flex-col">
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

                <AdjustableImage imageUrls={currentImages} className="text-green-dark" />
              </section>

              <footer
                style={{ backgroundColor: selectedColorScheme.accent }}
                className=" relative flex flex-col w-full pb-1 "
              >
                <div
                  style={{
                    backgroundColor: selectedColorScheme.primary,
                    color: selectedColorScheme.primaryText,
                  }}
                  className="relative w-full flex items-center justify-around p-1 "
                >
                  <NextImage
                    src="/logo300.webp"
                    alt="Logo de Adopta"
                    width={85}
                    height={85}
                    className=" object-contain"
                  />
                  {selectedContacts.length > 0 && (
                    <div className="flex flex-col gap-0.5 items-center justify-around">
                      <p className=" text-sm text-center font-bold ">
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
                    value={`www.porlosanimalesmaldonado.com/adopta/${animal.id}`}
                    size={60}
                    level="H"
                  />
                </div>
                <p className="text-xs text-cream-light text-center">
                  {`porlosanimalesmaldonado.com/adopta/${animal.id}`}
                </p>
              </footer>
            </div>

            {/* Botón descarga */}
            <button
              onClick={capturar}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Descargar
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
