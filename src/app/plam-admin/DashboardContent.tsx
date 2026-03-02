'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap/dist/gsap';
import Chart from '@/components/Chart';
import { Animal, DashboardAnalyticsData, LeanTransaction, UserType } from '@/types';
import {
  generateActiveAnimalsChartData,
  generateTransactionsByUserData,
  generateAnimalsInOutData,
  generateAnimalStatusData,
  generateTransactionsByUserFromAggregates,
  generateAnimalsInOutFromAggregates,
  generateActiveAnimalsFromAggregates,
} from '@/lib/animalFilters';
import { getTransactionLabel } from '@/lib/constants/animalLabels';
import Link from 'next/link';
import { createTimestamp } from '@/lib/dateUtils';

// ─── Preset configuration ────────────────────────────────

/** Available time period preset keys */
type PresetKey = '7d' | '30d' | '3m' | '6m' | '1a';

/** Preset definitions with display labels and time range values */
const PRESETS: { key: PresetKey; label: string; days?: number; months?: number }[] = [
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '3m', label: '3 meses', months: 3 },
  { key: '6m', label: '6 meses', months: 6 },
  { key: '1a', label: '1 año', months: 12 },
];

/** Short presets use filtered recentTransactions; long presets use monthly aggregates */
function isShortPreset(key: PresetKey): boolean {
  return key === '7d' || key === '30d';
}

/** Get the configuration for a specific preset key */
function getPresetConfig(key: PresetKey): { days?: number; months?: number } {
  const preset = PRESETS.find((p) => p.key === key);
  return { days: preset?.days, months: preset?.months };
}

/**
 * Returns an array of YYYY-MM keys for the last N months (including current).
 * Used for long preset stat card calculations.
 */
function getMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
  }
  return keys;
}

// ─── Chart data types ────────────────────────────────────

/** Shape of all chart datasets used in the dashboard */
interface ChartDataState {
  activeAnimals: { label: string; value: number }[];
  transactionsByUser: { name: string; value: number }[];
  animalsInOut: { label: string; datasets: { name: string; value: number }[] }[];
  status: { name: string; value: number }[];
}

interface DashboardContentProps {
  initialAnimals: Animal[];
  initialUsers: UserType[];
  initialAnalytics: DashboardAnalyticsData | null;
}

/**
 * Client-side interactive content for the admin dashboard.
 * Receives pre-fetched data from the Server Component including cached analytics.
 * Uses preset period filters (7d, 30d, 3m, 6m, 1a) instead of date inputs.
 *
 * - Short presets (7d, 30d): filter recentTransactions from analytics
 * - Long presets (3m, 6m, 1a): use monthly aggregates from analytics
 * - "Ver Detalles" loads full transaction on-demand via getFullTransaction (client-side auth)
 */
export default function DashboardContent({
  initialAnimals,
  initialUsers,
  initialAnalytics,
}: DashboardContentProps): React.ReactNode {
  const cardsRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  const [activePreset, setActivePreset] = useState<PresetKey>('7d');

  // Status chart data (independent of time preset — depends only on current animal status)
  const statusData = useMemo(
    () => generateAnimalStatusData({ animals: initialAnimals }),
    [initialAnimals]
  );

  // Chart data computed from active preset
  const chartData = useMemo((): ChartDataState => {
    if (!initialAnalytics) {
      return { activeAnimals: [], transactionsByUser: [], animalsInOut: [], status: statusData };
    }

    if (isShortPreset(activePreset)) {
      // Short presets: filter recentTransactions then use existing chart functions
      const { days } = getPresetConfig(activePreset);
      const daysValue = days ?? 7;
      const now = createTimestamp();
      const cutoff = now - daysValue * 24 * 60 * 60 * 1000;
      const filtered = initialAnalytics.recentTransactions.filter((tx) => tx.date >= cutoff);

      let dayInterval = 30;
      if (daysValue < 7) dayInterval = 1;
      else if (daysValue < 15) dayInterval = 2;
      else if (daysValue < 30) dayInterval = 5;
      else if (daysValue < 60) dayInterval = 10;

      return {
        activeAnimals: generateActiveAnimalsChartData({
          animals: initialAnimals,
          transactions: filtered,
          startDate: cutoff,
          endDate: now,
          dayInterval,
        }),
        transactionsByUser: generateTransactionsByUserData({
          transactions: filtered,
          users: initialUsers,
          months: Math.ceil(daysValue / 30),
        }),
        animalsInOut: generateAnimalsInOutData({
          animals: initialAnimals,
          transactions: filtered,
          startDate: cutoff,
          endDate: now,
          dayInterval,
        }),
        status: statusData,
      };
    }

    // Long presets: use monthly aggregates (no client-side Firestore reads)
    const { months } = getPresetConfig(activePreset);
    const monthsValue = months ?? 3;

    return {
      activeAnimals: generateActiveAnimalsFromAggregates({
        animals: initialAnimals,
        monthly: initialAnalytics.monthly,
        months: monthsValue,
      }),
      transactionsByUser: generateTransactionsByUserFromAggregates({
        monthly: initialAnalytics.monthly,
        users: initialUsers,
        months: monthsValue,
      }),
      animalsInOut: generateAnimalsInOutFromAggregates({
        animals: initialAnimals,
        monthly: initialAnalytics.monthly,
        months: monthsValue,
      }),
      status: statusData,
    };
  }, [activePreset, initialAnalytics, initialAnimals, initialUsers, statusData]);

  // Summary statistics for stat cards
  const { totalAnimals, adoptedAnimals, availableAnimals } = useMemo(() => {
    const available = initialAnimals.filter((a) => a.status !== 'adoptado' && a.isAvailable).length;

    if (!initialAnalytics) {
      return { totalAnimals: 0, adoptedAnimals: 0, availableAnimals: available };
    }

    if (isShortPreset(activePreset)) {
      const { days } = getPresetConfig(activePreset);
      const daysValue = days ?? 7;
      const cutoff = createTimestamp() - daysValue * 24 * 60 * 60 * 1000;
      const filtered = initialAnalytics.recentTransactions.filter((tx) => tx.date >= cutoff);

      // Animal IDs with activity in period + animals created in period
      const animalIds = new Set(filtered.map((tx) => tx.id));
      initialAnimals.forEach((animal) => {
        if (new Date(animal.waitingSince).getTime() >= cutoff) {
          animalIds.add(animal.id);
        }
      });

      // Count adoptions from transactions (initialAnimals excludes adopted animals)
      const adoptedIds = new Set(
        filtered.filter((tx) => tx.status === 'adoptado').map((tx) => tx.id)
      );

      return {
        totalAnimals: animalIds.size,
        adoptedAnimals: adoptedIds.size,
        availableAnimals: available,
      };
    }

    // Long presets: use monthly aggregate IDs
    const { months } = getPresetConfig(activePreset);
    const monthsValue = months ?? 3;
    const keys = getMonthKeys(monthsValue);

    const allAnimalIds = new Set<string>();
    const adoptedIds = new Set<string>();

    keys.forEach((key) => {
      const agg = initialAnalytics.monthly[key];
      if (!agg) return;
      agg.animalIdsWithTx.forEach((id) => allAnimalIds.add(id));
      agg.adoptedAnimalIds.forEach((id) => adoptedIds.add(id));
    });

    return {
      totalAnimals: allAnimalIds.size,
      adoptedAnimals: adoptedIds.size,
      availableAnimals: available,
    };
  }, [activePreset, initialAnalytics, initialAnimals]);

  // GSAP entrance animations
  useEffect(() => {
    const tl = gsap.timeline();

    if (selectorRef.current) {
      tl.fromTo(
        selectorRef.current,
        { opacity: 0, y: -30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.2)' }
      );
    }

    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      tl.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.8 },
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
  }, []);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Dashboard - Por Los Animales Maldonado
        </h1>

        {/* Preset Period Filter */}
        <div ref={selectorRef} className="bg-white rounded-3xl p-6 shadow-lg mb-6 opacity-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Período de Análisis</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setActivePreset(preset.key)}
                  className={`px-4 py-2 rounded-3xl font-semibold transition ${
                    activePreset === preset.key
                      ? 'bg-amber-sunset text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Total Animales</h3>
            <p className="text-7xl text-white">{totalAnimals}</p>
            <p className="text-sm text-cream-light mt-1">En el período seleccionado</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-green-dark mb-2">Adoptados</h3>
            <p className="text-7xl text-green-dark">{adoptedAnimals}</p>
            <p className="text-sm text-green-dark mt-1">Con familia en este período</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Disponibles</h3>
            <p className="text-7xl text-white">{availableAnimals}</p>
            <p className="text-sm text-cream-light mt-1">Buscando hogar actualmente</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Active Animals Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Animales Activos
              <span className="text-sm font-normal text-gray-500 ml-2">(Período seleccionado)</span>
            </h2>
            {chartData.activeAnimals.length > 0 ? (
              <Chart type="line" data={chartData.activeAnimals} colors={['#dda15e']} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Transactions by User Chart */}
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

          {/* Latest Events */}
          <div className="bg-white rounded-3xl p-6 shadow-lg row-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Últimos eventos</h2>
            <section className="max-h-[800px] overflow-y-auto">
              {initialAnalytics && initialAnalytics.recentTransactions.length > 0 ? (
                initialAnalytics.recentTransactions.slice(0, 5).map((tx) => {
                  const user = initialUsers.find((u) => u.id === tx.modifiedBy);
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
                      key={tx.transactionId}
                      className="border-b border-gray-200 py-3 last:border-0 flex flex-col sm:flex-row sm:justify-between w-full"
                    >
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex gap-2 items-center justify-between w-full">
                          <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <img
                              src={tx.img?.imgUrl}
                              alt={tx.img?.imgAlt || 'Imagen del animal'}
                              className="w-16 h-16 rounded-full object-cover object-center"
                            />
                            <p className="font-semibold text-2xl text-gray-800">{tx.name}</p>
                          </div>
                          {tx.transactionType && (
                            <p className="text-sm px-3 py-1 bg-amber-sunset text-white rounded-3xl">
                              {getTransactionLabel(tx.transactionType)}
                            </p>
                          )}
                          <span className="font-normal text-sm text-amber-sunset text-center text-balance">
                            Modificado por {user?.name ?? tx.modifiedBy.split('@')[0]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 text-center">{date} hs</p>
                        <Link
                          href={`/plam-admin/animales/${tx.id}#linea-del-tiempo`}
                          className="text-sm px-3 py-1 bg-amber-sunset text-white rounded-3xl hover:bg-green-forest transition text-center"
                        >
                          Ver Detalles
                        </Link>
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

          {/* Animal Status Chart */}
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

          {/* Animals In/Out Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Nuevos Ingresos vs Adopciones
              <span className="text-sm font-normal text-gray-500 ml-2">(Período seleccionado)</span>
            </h2>
            {chartData.animalsInOut.length > 0 ? (
              <Chart type="line" data={chartData.animalsInOut} colors={['#bc6c25', '#606c38']} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
