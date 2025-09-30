'use client';

import React, { useEffect, useRef, useState, useReducer } from 'react';
import { gsap } from 'gsap/dist/gsap';
import Chart from '@/components/Chart';
import { Animal, AnimalTransactionType, UserType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { handleToast, handlePromiseToast } from '@/lib/handleToast';
import {
  generateActiveAnimalsChartData,
  generateTransactionsByUserData,
  generateAnimalsInOutData,
  generateAnimalStatusData,
} from '@/lib/animalFilters';
import Loader from '@/components/Loader';
import { Modal } from '@/components/Modal';
import Image from 'next/image';
import SmartLink from '@/lib/SmartLink';

// Types for chart data
type ChartDataState = {
  activeAnimals: { label: string; value: number }[];
  transactionsByUser: { name: string; value: number }[];
  animalsInOut: { label: string; datasets: { name: string; value: number }[] }[];
  status: { name: string; value: number }[];
};

// Actions for chart data reducer
type ChartDataAction =
  | { type: 'SET_CHART_DATA'; payload: ChartDataState }
  | { type: 'RESET_CHARTS' }
  | { type: 'SET_LOADING' };

// Initial state for charts
const initialChartState: ChartDataState = {
  activeAnimals: [],
  transactionsByUser: [],
  animalsInOut: [],
  status: [],
};

// Chart data reducer
function chartDataReducer(state: ChartDataState, action: ChartDataAction): ChartDataState {
  switch (action.type) {
    case 'SET_CHART_DATA':
      return action.payload;
    case 'RESET_CHARTS':
      return initialChartState;
    case 'SET_LOADING':
      return initialChartState; // Reset to empty state while loading
    default:
      return state;
  }
}

// Types for loading state
type LoadingState = {
  isLoading: boolean;
  error: string | null;
};

// Actions for loading reducer
type LoadingAction =
  | { type: 'START_LOADING' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; payload: string };

// Initial loading state
const initialLoadingState: LoadingState = {
  isLoading: true,
  error: null,
};

// Loading reducer
function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'START_LOADING':
      return { isLoading: true, error: null };
    case 'SUCCESS':
      return { isLoading: false, error: null };
    case 'ERROR':
      return { isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export default function PlamAdmin() {
  const cardsRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // State for real data
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<AnimalTransactionType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Month selector state
  const [selectedMonths, setSelectedMonths] = useState<number>(6);

  // Loading state with reducer
  const [loadingState, dispatchLoading] = useReducer(loadingReducer, initialLoadingState);
  const { isLoading, error } = loadingState;

  // Chart data state with reducer
  const [chartData, dispatchChartData] = useReducer(chartDataReducer, initialChartState);

  // Function to regenerate chart data with new month selection
  const regenerateCharts = (months: number) => {
    if (animals.length === 0 || transactions.length === 0) {
      handleToast({
        type: 'warning',
        title: 'Sin datos',
        text: 'No hay datos disponibles para actualizar los gráficos',
      });
      return;
    }

    const activeAnimalsData = generateActiveAnimalsChartData({
      animals,
      transactions,
      months,
    });

    const animalsInOutData = generateAnimalsInOutData({
      animals,
      transactions,
      months,
    });

    // Now transactions by user also depends on months
    const transactionsByUserData = generateTransactionsByUserData({
      transactions,
      users,
      months, // Add month filtering
    });

    // Status doesn't depend on months, so we keep it as-is
    dispatchChartData({
      type: 'SET_CHART_DATA',
      payload: {
        activeAnimals: activeAnimalsData,
        transactionsByUser: transactionsByUserData,
        animalsInOut: animalsInOutData,
        status: chartData.status,
      },
    });
  };

  // Handle month selection change
  const handleMonthChange = (months: number) => {
    setSelectedMonths(months);
    regenerateCharts(months);

    // Show info toast about filter change
    handleToast({
      type: 'info',
      title: 'Filtro actualizado',
      text: `Mostrando datos de los últimos ${months} ${months === 1 ? 'mes' : 'meses'}`,
    });
  };

  // Load real data from Firestore
  useEffect(() => {
    const loadData = async () => {
      dispatchLoading({ type: 'START_LOADING' });

      // Create the promise for loading data
      const promises = Promise.all([
        getFirestoreData({ currentCollection: 'animals' }),
        getFirestoreData({ currentCollection: 'animalTransactions' }),
        getFirestoreData({ currentCollection: 'authorizedEmails' }),
      ])
        .then(([animalsData, transactionsData, usersData]) => {
          const fetchedAnimals = animalsData as Animal[];
          const fetchedTransactions = transactionsData as AnimalTransactionType[];
          const fetchedUsers = usersData as UserType[];

          const sortedTransactions = fetchedTransactions.sort((a, b) => b.date - a.date);

          setAnimals(fetchedAnimals);
          setTransactions(sortedTransactions);
          setUsers(fetchedUsers);

          // Generate chart data using filter functions (pass data, don't fetch)
          const activeAnimalsData = generateActiveAnimalsChartData({
            animals: fetchedAnimals,
            transactions: fetchedTransactions,
            months: selectedMonths,
          });
          const transactionsByUserData = generateTransactionsByUserData({
            transactions: fetchedTransactions,
            users: fetchedUsers,
            months: selectedMonths, // Add month filtering from the start
          });
          const animalsInOutData = generateAnimalsInOutData({
            animals: fetchedAnimals,
            transactions: fetchedTransactions,
            months: selectedMonths,
          });
          const statusData = generateAnimalStatusData({ animals: fetchedAnimals });

          dispatchChartData({
            type: 'SET_CHART_DATA',
            payload: {
              activeAnimals: activeAnimalsData,
              transactionsByUser: transactionsByUserData,
              animalsInOut: animalsInOutData,
              status: statusData,
            },
          });

          dispatchLoading({ type: 'SUCCESS' });

          // Return data for success message
          return { animals: fetchedAnimals, users: fetchedUsers };
        })
        .catch((error) => {
          console.error('Error loading dashboard data:', error);
          dispatchLoading({ type: 'ERROR', payload: 'Error cargando datos del dashboard' });
          dispatchChartData({ type: 'RESET_CHARTS' });
          throw error; // Re-throw to trigger promise toast error
        });

      // Use handlePromiseToast for automatic loading, success, and error handling
      handlePromiseToast(promises, {
        messages: {
          pending: {
            title: 'Cargando Dashboard',
            text: 'Obteniendo datos del sistema...',
          },
          success: {
            title: 'Dashboard Cargado',
            text: 'Todos los datos fueron cargados exitosamente',
          },
          error: {
            title: 'Error al Cargar',
            text: 'No se pudieron cargar los datos. Por favor, recarga la página.',
          },
        },
      });
    };

    loadData();
  }, []); // Solo cargar una vez al inicio

  // Calculate summary statistics
  const totalAnimals = animals.length;
  const adoptedAnimals = animals.filter((animal) => animal.status === 'adoptado').length;
  const availableAnimals = animals.filter(
    (animal) => animal.status !== 'adoptado' && animal.isAvalible
  ).length;

  // Animación de los componentes al cargar
  useEffect(() => {
    if (isLoading) return;

    // Show welcome toast on first load
    if (animals.length > 0) {
      setTimeout(() => {
        handleToast({
          type: 'info',
          title: '¡Bienvenido al Dashboard!',
          text: 'Usa el selector de período para filtrar los datos temporales',
        });
      }, 1500); // Delay para que las animaciones terminen
    }

    // Timeline para coordinar las animaciones
    const tl = gsap.timeline();

    // Animar el selector primero
    if (selectorRef.current) {
      tl.fromTo(
        selectorRef.current,
        {
          opacity: 0,
          y: -30,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.2)',
        }
      );
    }

    // Luego animar las cards con stagger
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      tl.fromTo(
        cards,
        {
          opacity: 0,
          y: 50,
          scale: 0.8,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'back.out(1.7)',
        },
        '-=0.3' // Empezar un poco antes de que termine la animación del selector
      );
    }
  }, [isLoading]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Dashboard - Por Los Animales Maldonado
        </h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error} - No se pudieron cargar los datos</p>
          </div>
        )}

        {/* Month Selector */}
        <div ref={selectorRef} className="bg-white rounded-3xl p-6 shadow-lg mb-6 opacity-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Período de Análisis</h2>
            <div className="flex items-center gap-3">
              <label htmlFor="months-selector" className="text-lg font-semibold  text-gray-700">
                Últimos:
              </label>
              <select
                id="months-selector"
                value={selectedMonths}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>1 mes</option>
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={9}>9 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-white mb-2">Total Animales</h3>
            <p className="text-7xl  text-white">{totalAnimals}</p>
            <p className="text-sm text-cream-light mt-1">Registrados en el sistema</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-green-dark mb-2">Adoptados</h3>
            <p className="text-7xl  text-green-dark">{adoptedAnimals}</p>
            <p className="text-sm text-green-dark mt-1">Animales con familia</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-white mb-2">Disponibles</h3>
            <p className="text-7xl  text-white">{availableAnimals}</p>
            <p className="text-sm text-cream-light mt-1">Buscando hogar</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Animales Activos por Mes
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Últimos {selectedMonths} meses)
              </span>
            </h2>
            {chartData.activeAnimals.length > 0 ? (
              <Chart type="line" data={chartData.activeAnimals} colors={['#dda15e']} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No hay datos disponibles</p>
                  <button
                    onClick={() =>
                      handleToast({
                        type: 'info',
                        title: 'Sin datos temporales',
                        text: 'Intenta cambiar el período de análisis o verifica que hay transacciones en el sistema',
                      })
                    }
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    ¿Por qué no veo datos?
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Transacciones por Usuario
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Últimos {selectedMonths} meses)
              </span>
            </h2>
            {chartData.transactionsByUser.length > 0 ? (
              <Chart
                type="pie"
                data={chartData.transactionsByUser}
                colors={['#bc6c25', '#606c38', '#dda15e']}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg row-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Ultimas transacciones
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Últimos {selectedMonths} meses)
              </span>
            </h2>
            <section className="max-h-[800px] overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map((tx, index) => {
                  const animal = animals.find((a) => a.id === tx.id);
                  const user = users.find((u) => u.id === tx.modifiedBy);
                  const keys = Object.keys(tx || {});
                  const date = new Date(tx.date).toLocaleDateString('es-UY', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <div
                      key={tx.id + index}
                      className="border-b border-gray-200 py-3 last:border-0 flex flex-col sm:flex-row sm:justify-between w-full"
                    >
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex gap-2 items-center justify-between w-full">
                          <p className="font-semibold text-2xl text-gray-800">{animal?.name}</p>
                          <span className="font-normal text-sm text-amber-sunset text-center text-balance">
                            Modificado por {user?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 text-center">{date} hs</p>
                        <section className="flex flex-wrap gap-0">
                          <p className="text-sm text-green-dark"> Modificaciones en:</p>

                          <ul className="flex px-2 gap-2 flex-wrap ">
                            {keys.map((key) => {
                              if (
                                key === 'id' ||
                                key === 'modifiedBy' ||
                                key === 'date' ||
                                key === 'name'
                              )
                                return null;
                              return (
                                <li key={tx.id + key} className="text-sm text-amber-sunset ">
                                  <span className="font-medium">{key}</span>{' '}
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                        <Modal
                          buttonText="Ver Detalles"
                          buttonStyles="text-sm px-3 py-1 bg-amber-sunset text-white rounded-3xl hover:bg-green-forest transition"
                        >
                          <section className="bg-cream-light w-full min-h-full flex flex-col items-center justify-start p-4 rounded-3xl shadow-lg">
                            <h2 className="text-2xl font-semibold p-2">
                              Detalles de la modificación
                            </h2>
                            <div className="w-full flex items-center justify-center max-w-md">
                              {animal?.images?.[0] && (
                                <Image
                                  src={animal?.images[0].imgUrl}
                                  alt={animal?.name}
                                  width={200}
                                  height={100}
                                  className="object-cover rounded-lg"
                                />
                              )}
                            </div>
                            <ul
                              key={`${index}-${tx.date}`}
                              className="text-xl text-start font-semibold flex flex-col gap- p-2  "
                            >
                              <li className="font-semibold">
                                {' '}
                                Fecha: <span className="font-normal">{date} hs</span>
                              </li>
                              {tx.modifiedBy !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Actualizado por:{' '}
                                  <span className="font-normal">{tx.modifiedBy}</span>
                                </li>
                              )}
                              {tx.name !== undefined && (
                                <li className="font-semibold">
                                  Nombre: <span className="font-normal">{tx.name}</span>
                                </li>
                              )}
                              {tx.description !== undefined && (
                                <li className="font-semibold">
                                  Descripción: <span className="font-normal">{tx.description}</span>
                                </li>
                              )}
                              {tx.gender !== undefined && (
                                <li className="font-semibold">
                                  Género: <span className="font-normal">{tx.gender}</span>
                                </li>
                              )}
                              {tx.aproxBirthDate !== undefined && (
                                <li className="font-semibold">
                                  Fecha de nacimiento aproximada:{' '}
                                  <span className="font-normal">{tx.aproxBirthDate}</span>
                                </li>
                              )}
                              {tx.isSterilized !== undefined && (
                                <li className="font-semibold">
                                  Esterilizado:{' '}
                                  <span className="font-normal">{`${tx.isSterilized ? 'Si' : 'No'}`}</span>
                                </li>
                              )}
                              {tx.lifeStage !== undefined && (
                                <li className="font-semibold">
                                  Etapa de vida: <span className="font-normal">{tx.lifeStage}</span>
                                </li>
                              )}
                              {tx.isAvalible !== undefined && (
                                <li className="font-semibold">
                                  Estado:{' '}
                                  <span className="font-normal">{`${tx.isAvalible ? 'Disponible' : 'No disponible'}`}</span>
                                </li>
                              )}
                              {tx.isVisible !== undefined && (
                                <li className="font-semibold">
                                  Mostrar:{' '}
                                  <span className="font-normal">{`${tx.isVisible ? 'Mostrar' : 'Ocultar'}`}</span>
                                </li>
                              )}
                              {tx.isDeleted !== undefined && (
                                <li className="font-semibold">
                                  Eliminado:{' '}
                                  <span className="font-normal">{`${tx.isDeleted ? 'Si' : 'No'}`}</span>
                                </li>
                              )}
                              {tx.status !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Situación actual: <span className="font-normal">{tx.status}</span>
                                </li>
                              )}
                              {tx.size !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Tamaño: <span className="font-normal">{tx.size}</span>
                                </li>
                              )}
                              {tx.species !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Especie: <span className="font-normal">{tx.species}</span>
                                </li>
                              )}
                              {tx.contactName !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Contacto: <span className="font-normal">{tx.contactName}</span>
                                </li>
                              )}
                              {tx.notes !== undefined && (
                                <li className="font-semibold">
                                  {' '}
                                  Notas: <span className="font-normal">{tx.notes}</span>
                                </li>
                              )}
                              {tx.contacts &&
                                tx.contacts.map((contact, index) => (
                                  <li
                                    key={`${index}-${contact.value}`}
                                    className="text-xl font-semibold capitalize"
                                  >
                                    {contact.type}:{' '}
                                    <span className="font-normal">{contact.value}</span>
                                  </li>
                                ))}
                            </ul>
                            <SmartLink
                              href={`/plam-admin/animales/${tx.id}`}
                              className="mt-4 inline-block rounded bg-caramel-deep px-4 py-2 text-white hover:bg-green-forest transition"
                            >
                              Ver detalles
                            </SmartLink>
                          </section>
                        </Modal>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </section>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Estado de Animales</h2>
            {chartData.status.length > 0 ? (
              <Chart
                type="pie"
                data={chartData.status}
                colors={['#606c38', '#dda15e', '#bc6c25', '#283618']}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Nuevos Ingresos vs Adopciones
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Últimos {selectedMonths} meses)
              </span>
            </h2>
            {chartData.animalsInOut.length > 0 ? (
              <Chart type="line" data={chartData.animalsInOut} colors={['#bc6c25', '#606c38']} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No hay datos disponibles</p>
                  <button
                    onClick={() =>
                      handleToast({
                        type: 'info',
                        title: 'Sin datos de flujo',
                        text: 'Intenta cambiar el período de análisis o verifica que hay animales registrados en el sistema',
                      })
                    }
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    ¿Por qué no veo datos?
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
