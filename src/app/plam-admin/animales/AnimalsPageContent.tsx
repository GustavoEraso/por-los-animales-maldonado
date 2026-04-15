'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Animal } from '@/types';
import FloatButton from '@/elements/FloatButton';

import {
  EyeIcon,
  EditIcon,
  TrashIcon,
  HeartIcon,
  FilterIcon,
  GridViewIcon,
  TableViewIcon,
  CalendarIcon,
} from '@/components/Icons';
import SearchBox from '@/components/SearchBox';
import Card from '@/components/Card';
import { gsap } from 'gsap';
import ProtectedRoute from '@/components/ProtectedRoute';

interface AnimalsPageContentProps {
  initialAnimals: Animal[];
}

/**
 * Client-side interactive content for the admin animals page.
 * Receives pre-fetched animals from the Server Component and applies
 * client-side filtering, sorting, and animations.
 */
export default function AnimalsPageContent({ initialAnimals }: AnimalsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize infoModeRender from localStorage
  const [infoModeRender, setInfoModeRender] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('animalViewMode');
      return saved === 'table' || saved === 'grid' ? saved : 'grid';
    }
    return 'grid';
  });

  // Save to localStorage when view mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('animalViewMode', infoModeRender);
    }
  }, [infoModeRender]);

  const [sortReference, setSortReference] = useState<string | boolean>('name');
  const [sortOrder, setSortOrder] = useState('>');

  // Filter animals based on searchParams (data already fetched by server)
  const filteredAnimals = useMemo(() => {
    let filtered = [...initialAnimals];

    // Get all search params
    const id = searchParams.get('id');
    const nombre = searchParams.get('nombre');
    const estados = searchParams.get('estados');
    const esVisible = searchParams.get('esVisible');
    const estaDisponible = searchParams.get('estaDisponible');
    const estaCastrado = searchParams.get('estaCastrado');
    const especies = searchParams.get('especies');
    const tamanos = searchParams.get('tamanos');
    const generos = searchParams.get('generos');
    const etapasVida = searchParams.get('etapasVida');
    const compatibleConPerros = searchParams.get('compatibleConPerros');
    const compatibleConGatos = searchParams.get('compatibleConGatos');
    const compatibleConNinos = searchParams.get('compatibleConNinos');

    // ID filter
    if (id) {
      filtered = filtered.filter((animal) => animal.id === id);
    }

    // Name filter (partial match, case-insensitive)
    if (nombre) {
      const nombreLower = nombre.toLowerCase();
      filtered = filtered.filter((animal) => animal.name.toLowerCase().includes(nombreLower));
    }

    // Status filter (estados) - overrides default if specified
    if (estados) {
      const estadosArray = estados.split(',');
      filtered = filtered.filter((animal) => estadosArray.includes(animal.status));
    }

    // Visibility filter
    if (esVisible) {
      const isVisible = esVisible === 'si';
      filtered = filtered.filter((animal) => animal.isVisible === isVisible);
    }

    // Available filter
    if (estaDisponible) {
      const isAvailable = estaDisponible === 'si';
      filtered = filtered.filter((animal) => animal.isAvailable === isAvailable);
    }

    // Sterilized filter
    if (estaCastrado && estaCastrado !== 'no_se') {
      filtered = filtered.filter((animal) => animal.isSterilized === estaCastrado);
    }

    // Species filter
    if (especies) {
      const especiesArray = especies.split(',');
      filtered = filtered.filter((animal) => especiesArray.includes(animal.species));
    }

    // Size filter
    if (tamanos) {
      const tamanosArray = tamanos.split(',');
      filtered = filtered.filter((animal) => tamanosArray.includes(animal.size));
    }

    // Gender filter
    if (generos) {
      const generosArray = generos.split(',');
      filtered = filtered.filter((animal) => generosArray.includes(animal.gender));
    }

    // Life stage filter
    if (etapasVida) {
      const etapasVidaArray = etapasVida.split(',');
      filtered = filtered.filter((animal) => etapasVidaArray.includes(animal.lifeStage));
    }

    // Compatibility filters
    if (compatibleConPerros) {
      const perrosArray = compatibleConPerros.split(',');
      filtered = filtered.filter((animal) =>
        perrosArray.includes(animal.compatibility?.dogs || 'no_se')
      );
    }

    if (compatibleConGatos) {
      const gatosArray = compatibleConGatos.split(',');
      filtered = filtered.filter((animal) =>
        gatosArray.includes(animal.compatibility?.cats || 'no_se')
      );
    }

    if (compatibleConNinos) {
      const ninosArray = compatibleConNinos.split(',');
      filtered = filtered.filter((animal) =>
        ninosArray.includes(animal.compatibility?.kids || 'no_se')
      );
    }

    return filtered;
  }, [initialAnimals, searchParams]);

  // Calculate sorted animals using useMemo
  const sortedAnimals = useMemo(() => {
    if (filteredAnimals.length < 1) {
      return [];
    }

    // Check if there's sorting from searchParams
    const ordenarPor = searchParams.get('ordenarPor');
    const orden = searchParams.get('orden') || 'asc';

    let sortedData = [...filteredAnimals];

    if (ordenarPor) {
      // Use searchParams sorting
      const sortKey = ordenarPor as keyof Animal;

      sortedData.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          if (orden === 'asc') {
            return aVal === bVal ? 0 : aVal ? 1 : -1;
          } else {
            return aVal === bVal ? 0 : aVal ? -1 : 1;
          }
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          return orden === 'asc' ? aVal - bVal : bVal - aVal;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          return orden === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    } else {
      // Use table header sorting
      const ref = sortReference as keyof Animal;
      const order = sortOrder;

      if (typeof filteredAnimals[0][ref] === 'boolean') {
        sortedData = filteredAnimals.slice().sort((a, b) => {
          if (order == '<') {
            return a[ref] === b[ref] ? 0 : a[ref] ? 1 : -1;
          } else {
            return a[ref] === b[ref] ? 0 : a[ref] ? -1 : 1;
          }
        });
      } else if (typeof filteredAnimals[0][ref] === 'number') {
        sortedData = filteredAnimals.slice().sort((a, b) => {
          if (order == '<') {
            return Number(a[ref]) - Number(b[ref]);
          } else {
            return Number(b[ref]) - Number(a[ref]);
          }
        });
      } else if (typeof filteredAnimals[0][ref] === 'string') {
        sortedData = filteredAnimals.slice().sort((a, b) => {
          const aVal = a[ref] as string;
          const bVal = b[ref] as string;

          return order === '<' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
      }
    }

    return sortedData;
  }, [filteredAnimals, sortOrder, sortReference, searchParams]);

  // GSAP animation for grid
  useEffect(() => {
    if (gridRef.current && sortedAnimals.length > 0 && infoModeRender === 'grid') {
      const cards = gridRef.current.children;

      // Set initial state immediately
      gsap.set(cards, {
        opacity: 0,
        y: 500,
        scale: 0.8,
      });

      // Animate to final state
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: {
          amount: 1,
          grid: 'auto',
          from: 'random',
        },
        ease: 'power2.out',
      });
    }
  }, [sortedAnimals, infoModeRender]);

  const sortAnimalBy = ({ reference }: { reference: string | boolean }): void => {
    if (sortReference === reference) {
      setSortOrder(() => (sortOrder == '>' ? '<' : '>'));
      return;
    }
    setSortReference(reference);
  };
  const renderDirection = (ref: string): string =>
    sortReference === ref ? (sortOrder === '>' ? '▼' : '▲') : '';

  return (
    <ProtectedRoute requiredRole="rescatista" redirectPath="plam-admin">
      <section className=" bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-2  items-center pb-28">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between w-full ">
          <div className="flex  bg-cream-light p-3 rounded  justify-center-safe">
            <div className="flex items-center gap-2 rounded p-2 bg-amber-sunset">
              <FilterIcon size="md" className="text-gray-600" title="Filtros activos" />
              <h3 className=" text-2xl font-bold underline">Casos</h3>
            </div>
            <Link
              href={'/plam-admin/animales/linea-tiempo'}
              className="flex items-center gap-2 px-2 text-gray-400"
            >
              <CalendarIcon size="md" title="Calendario de adopciones" />
              <h4 className="text-2xl font-bold underline">Eventos</h4>
            </Link>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 bg-cream-light rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setInfoModeRender('grid')}
              className={`p-2 rounded transition-colors ${
                infoModeRender === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Vista de cuadrícula"
            >
              <GridViewIcon size={24} />
            </button>
            <button
              onClick={() => setInfoModeRender('table')}
              className={`p-2 rounded transition-colors ${
                infoModeRender === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Vista de tabla"
            >
              <TableViewIcon size={24} />
            </button>
          </div>
        </div>
        <SearchBox dashboardMode />
        {infoModeRender === 'grid' && (
          <div
            ref={gridRef}
            className="w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
          >
            {sortedAnimals.map((animal) => (
              <Card
                key={animal.id}
                adminView
                animal={animal}
                href={`/plam-admin/animales/${animal.id}`}
              />
            ))}
          </div>
        )}
        {infoModeRender === 'table' && (
          <div className="  w-full relative overflow-x-auto shadow-md rounded-lg ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="w-fit" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'id' })}
                    >{`ID ${renderDirection('id')}`}</button>
                  </th>
                  <th className="w-fit" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'name' })}
                    >{`NOMBRE ${renderDirection('name')}`}</button>
                  </th>
                  <th className="w-fit hidden sm:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'gender' })}
                    >{`GENERO ${renderDirection('gender')}`}</button>
                  </th>
                  <th className="w-fit hidden md:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'species' })}
                    >{`ESPECIE ${renderDirection('species')}`}</button>
                  </th>
                  <th className="w-fit hidden md:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'lifeStage' })}
                    >{`EDAD ${renderDirection('lifeStage')}`}</button>
                  </th>
                  <th className="w-fit" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start  hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'status' })}
                    >{`SITUACIÓN ${renderDirection('status')}`}</button>
                  </th>
                  <th className="w-fit hidden sm:table-cell" scope="col">
                    <button
                      className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300"
                      onClick={() => sortAnimalBy({ reference: 'isAvailable' })}
                    >{`VISIBLE ${renderDirection('isAvailable')}`}</button>
                  </th>
                  <th scope="col" className=" py-3">
                    <span className="sr-only">Ver Detalles</span>
                  </th>
                  <th scope="col" className=" py-3">
                    <span className="sr-only">Editar</span>
                  </th>
                  <th scope="col hidden md:table-cell" className=" py-3">
                    <span className="sr-only">Elimiar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.length > 0 &&
                  sortedAnimals?.map((animal) => (
                    <tr key={animal.id} className="bg-white border-b hover:bg-gray-50">
                      <th
                        scope="row"
                        className="px-2 py-4 outline-1 outline-slate-200 font-medium text-gray-900 whitespace-nowrap text-center"
                      >
                        {animal.id}
                      </th>
                      <td className="px-2 py-4 outline-1 outline-slate-200">
                        {animal.name}
                        {animal.litterId && (
                          <span className="ml-1 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded">
                            🐾 {animal.litterName || 'Camada'}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden sm:table-cell">
                        {animal.gender}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden md:table-cell ">
                        {animal.species}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 hidden md:table-cell">
                        {animal.lifeStage}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 text-nowrap">
                        {animal.status}
                      </td>
                      <td className="px-2 py-4 outline-1 outline-slate-200 text-nowrap ">
                        {animal.isVisible ? 'Sí' : 'No'}
                      </td>
                      <td className="px-2 py-4 text-right">
                        <Link
                          href={`/plam-admin/animales/${animal.id}`}
                          className="font-medium text-green-600 hover:underline flex items-center justify-end gap-1"
                        >
                          <EyeIcon size={16} title="Ver detalles" />
                          <span className="hidden lg:inline">Ver Detalles</span>
                        </Link>
                      </td>
                      <td className="px-2 py-4 text-right ">
                        <Link
                          href={`/plam-admin/animales/editar/${animal.id}`}
                          className="font-medium text-blue-600 hover:underline flex items-center justify-end gap-1"
                        >
                          <EditIcon size={16} title="Editar animal" />
                          <span className="hidden lg:inline">Editar</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredAnimals.length < 1 && <p className="text-center">No hay animales que mostar</p>}

        <Link
          className="bg-green-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 flex items-center gap-2"
          href="/plam-admin/animales/casos-cerrados"
        >
          <HeartIcon size={20} title="Ver animales adoptados" color="white" />
          Casos Cerrados
        </Link>
        <Link
          className="bg-red-600 text-white text-xl px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300 flex items-center gap-2"
          href="/plam-admin/animales/papelera"
        >
          <TrashIcon size={20} title="Ver papelera" color="white" />
          Ver Papelera
        </Link>
        <FloatButton
          buttonStyle="add"
          action={() => {
            router.replace('/plam-admin/animales/crear');
          }}
        />
      </section>
    </ProtectedRoute>
  );
}
