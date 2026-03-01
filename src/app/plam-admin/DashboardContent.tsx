'use client';

import React, { useEffect, useRef, useState, useReducer, useMemo, useCallback } from 'react';
import { gsap } from 'gsap/dist/gsap';
import Chart from '@/components/Chart';
import { Animal, AnimalTransactionType, UserType } from '@/types';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { handleToast } from '@/lib/handleToast';
import {
  generateActiveAnimalsChartData,
  generateTransactionsByUserData,
  generateAnimalsInOutData,
  generateAnimalStatusData,
} from '@/lib/animalFilters';
import { Modal } from '@/components/Modal';
import TransactionCard from '@/components/TransactionCard';
import { getTransactionLabel } from '@/lib/constants/animalLabels';
import Link from 'next/link';

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
  | { type: 'RESET_CHARTS' };

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
    default:
      return state;
  }
}

interface DashboardContentProps {
  initialAnimals: Animal[];
  initialUsers: UserType[];
}

/**
 * Client-side interactive content for the admin dashboard.
 * Receives pre-fetched animals and users from the Server Component.
 * Handles transactions loading with dynamic date filters.
 */
export default function DashboardContent({ initialAnimals, initialUsers }: DashboardContentProps) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Transactions loaded dynamically based on date filter
  const [transactions, setTransactions] = useState<AnimalTransactionType[]>([]);
  const [searchController, setSearchController] = useState<boolean>(false);

  // Date filter helper functions
  const getInitialStartDate = (): number => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const getInitialEndDate = (): number => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  };

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ startDate: number; endDate: number }>({
    startDate: getInitialStartDate(),
    endDate: getInitialEndDate(),
  });

  // Temporary date filter for inputs (before applying)
  const [tempDateFilter, setTempDateFilter] = useState<{ startDate: number; endDate: number }>({
    startDate: getInitialStartDate(),
    endDate: getInitialEndDate(),
  });

  // Chart data state with reducer
  const [chartData, dispatchChartData] = useReducer(chartDataReducer, initialChartState);

  // Generate status chart on mount (doesn't depend on time)
  useEffect(() => {
    const statusData = generateAnimalStatusData({ animals: initialAnimals });
    dispatchChartData({
      type: 'SET_CHART_DATA',
      payload: {
        activeAnimals: [],
        transactionsByUser: [],
        animalsInOut: [],
        status: statusData,
      },
    });
  }, [initialAnimals]);

  // Function to regenerate chart data with new date range
  const regenerateCharts = useCallback(
    (startDate: number, endDate: number) => {
      if (initialAnimals.length === 0 || transactions.length === 0) {
        handleToast({
          type: 'warning',
          title: 'Sin datos',
          text: 'No hay datos disponibles para actualizar los gráficos',
        });
        return;
      }

      const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));

      const activeAnimalsData = generateActiveAnimalsChartData({
        animals: initialAnimals,
        transactions,
        months,
      });

      const animalsInOutData = generateAnimalsInOutData({
        animals: initialAnimals,
        transactions,
        months,
      });

      const transactionsByUserData = generateTransactionsByUserData({
        transactions,
        users: initialUsers,
        months,
      });

      dispatchChartData({
        type: 'SET_CHART_DATA',
        payload: {
          activeAnimals: activeAnimalsData,
          transactionsByUser: transactionsByUserData,
          animalsInOut: animalsInOutData,
          status: chartData.status,
        },
      });
    },
    [initialAnimals, transactions, initialUsers, chartData.status]
  );

  // Format timestamp to local date string for input
  const formatToLocalDateString = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date filter change
  const handleDateFilterChange = (): void => {
    setDateFilter(tempDateFilter);
    setSearchController(!searchController);
    regenerateCharts(tempDateFilter.startDate, tempDateFilter.endDate);

    const days = Math.ceil(
      (tempDateFilter.endDate - tempDateFilter.startDate) / (1000 * 60 * 60 * 24)
    );
    handleToast({
      type: 'info',
      title: 'Filtro actualizado',
      text: `Mostrando datos de ${days} días`,
    });
  };

  // Load transactions data with date filter
  useEffect(() => {
    const loadTransactions = async (): Promise<void> => {
      if (initialAnimals.length === 0 || initialUsers.length === 0) return;

      try {
        const transactionsData = await getFirestoreData({
          currentCollection: 'animalTransactions',
          orderBy: 'date',
          direction: 'desc',
          filter: [
            ['date', '>=', dateFilter.startDate],
            ['date', '<=', dateFilter.endDate],
          ],
        });

        const fetchedTransactions = transactionsData as AnimalTransactionType[];
        setTransactions(fetchedTransactions);

        // Calculate days and interval
        const totalDays = Math.ceil(
          (dateFilter.endDate - dateFilter.startDate) / (1000 * 60 * 60 * 24)
        );

        // Determine interval based on days
        let dayInterval = 30;
        if (totalDays < 7) {
          dayInterval = 1;
        } else if (totalDays < 15) {
          dayInterval = 2;
        } else if (totalDays < 30) {
          dayInterval = 5;
        } else if (totalDays < 60) {
          dayInterval = 10;
        }

        const activeAnimalsData = generateActiveAnimalsChartData({
          animals: initialAnimals,
          transactions: fetchedTransactions,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          dayInterval,
        });
        const transactionsByUserData = generateTransactionsByUserData({
          transactions: fetchedTransactions,
          users: initialUsers,
          months: Math.ceil(totalDays / 30),
        });
        const animalsInOutData = generateAnimalsInOutData({
          animals: initialAnimals,
          transactions: fetchedTransactions,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          dayInterval,
        });

        dispatchChartData({
          type: 'SET_CHART_DATA',
          payload: {
            activeAnimals: activeAnimalsData,
            transactionsByUser: transactionsByUserData,
            animalsInOut: animalsInOutData,
            status: chartData.status,
          },
        });
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    };

    loadTransactions();
  }, [searchController, initialAnimals, initialUsers, dateFilter, chartData.status]);

  // Calculate summary statistics filtered by selected time period
  const { totalAnimals, adoptedAnimals, availableAnimals } = useMemo(() => {
    const cutoffDate = new Date(dateFilter.startDate);

    const animalsInPeriod = initialAnimals.filter((animal) => {
      const hasRecentTransaction = transactions.some((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transaction.id === animal.id && transactionDate >= cutoffDate;
      });

      const animalCreated = new Date(animal.waitingSince);
      const createdInPeriod = animalCreated >= cutoffDate;

      return hasRecentTransaction || createdInPeriod;
    });

    const total = animalsInPeriod.length;
    const adopted = animalsInPeriod.filter((animal) => animal.status === 'adoptado').length;
    const available = animalsInPeriod.filter(
      (animal) => animal.status !== 'adoptado' && animal.isAvailable
    ).length;

    return {
      totalAnimals: total,
      adoptedAnimals: adopted,
      availableAnimals: available,
    };
  }, [initialAnimals, transactions, dateFilter]);

  // GSAP entrance animations
  useEffect(() => {
    const welcomeTimeout = setTimeout(() => {
      handleToast({
        type: 'info',
        title: '¡Bienvenido al Dashboard!',
        text: 'Usa el selector de período para filtrar los datos temporales',
      });
    }, 1500);

    const tl = gsap.timeline();

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
        '-=0.3'
      );
    }

    return () => clearTimeout(welcomeTimeout);
  }, []);

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Dashboard - Por Los Animales Maldonado
        </h1>

        {/* Date Filter */}
        <div ref={selectorRef} className="bg-white rounded-3xl p-6 shadow-lg mb-6 opacity-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Período de Análisis</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-lg font-semibold text-gray-700">Desde:</label>
              <input
                type="date"
                value={formatToLocalDateString(tempDateFilter.startDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                  setTempDateFilter((prev) => ({ ...prev, startDate: date.getTime() }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <label className="text-lg font-semibold text-gray-700">Hasta:</label>
              <input
                type="date"
                value={formatToLocalDateString(tempDateFilter.endDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                  setTempDateFilter((prev) => ({ ...prev, endDate: date.getTime() }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleDateFilterChange}
                className="px-4 py-2 bg-amber-sunset text-white rounded-3xl hover:bg-green-forest transition font-semibold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-white mb-2">Total Animales</h3>
            <p className="text-7xl  text-white">{totalAnimals}</p>
            <p className="text-sm text-cream-light mt-1">En el período seleccionado</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-green-dark mb-2">Adoptados</h3>
            <p className="text-7xl  text-green-dark">{adoptedAnimals}</p>
            <p className="text-sm text-green-dark mt-1">Con familia en este período</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg  text-white mb-2">Disponibles</h3>
            <p className="text-7xl  text-white">{availableAnimals}</p>
            <p className="text-sm text-cream-light mt-1">Buscando hogar actualmente</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Animales Activos por Mes
              <span className="text-sm font-normal text-gray-500 ml-2">(Período seleccionado)</span>
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
              <span className="text-sm font-normal text-gray-500 ml-2">(Período seleccionado)</span>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Ultimos eventos</h2>
            <section className="max-h-[800px] overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx) => {
                  const animal = initialAnimals.find((a) => a.id === tx.id);
                  const user = initialUsers.find((u) => u.id === tx.modifiedBy);
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
                      key={tx.id + tx.date}
                      className="border-b border-gray-200 py-3 last:border-0 flex flex-col sm:flex-row sm:justify-between w-full"
                    >
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex gap-2 items-center justify-between w-full">
                          <p className="font-semibold text-2xl text-gray-800">{animal?.name}</p>
                          <p className="text-sm px-3 py-1 bg-amber-sunset text-white rounded-3xl ">
                            {getTransactionLabel(tx.transactionType)}
                          </p>
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
                            <TransactionCard transaction={tx} showImg />
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
            <div className="flex items-center justify-center w-full mt-4">
              <Link
                href="/plam-admin/animales/linea-tiempo"
                className="text-md px-3 py-2 bg-amber-sunset text-white rounded-3xl hover:bg-green-forest transition"
              >
                Ver todos los eventos
              </Link>
            </div>
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
              <span className="text-sm font-normal text-gray-500 ml-2">(Período seleccionado)</span>
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
