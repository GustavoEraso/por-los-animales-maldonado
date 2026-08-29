'use client';
import { CalendarIcon, FilterIcon } from '@/components/Icons';
import Loader from '@/components/Loader';
import TransactionCard from '@/components/TransactionCard';
import ReportSection from './ReportSection';
import { getTransactionsByDateRange } from '@/lib/firebase/dailyTransactionAggregates';
import { getRescueReasonLabel } from '@/lib/constants/animalLabels';
import { ReportSummary } from '@/lib/reportGenerator';
import { AnimalTransactionType } from '@/types';
import Link from 'next/dist/client/link';
import { useEffect, useState, useRef, useMemo, useTransition } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { logger } from '@/lib/logger';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_DATE_FILTER = {
  startDate: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  })(),
  endDate: (() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  })(),
};

const MIN_LOADING_TIME = 600;
const VISIBLE_CARDS_STEP = 10;

const formatToLocalDateString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LineaTiempoPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [transactions, setransactions] = useState<AnimalTransactionType[]>([]);
  const [dateFilter, setDateFilter] = useState<{ startDate: number; endDate: number }>(
    INITIAL_DATE_FILTER
  );
  const [pendingDateFilter, setPendingDateFilter] = useState<{
    startDate: number;
    endDate: number;
  }>(INITIAL_DATE_FILTER);

  const [searchControler, setSearchControler] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(VISIBLE_CARDS_STEP);
  const [, startTransition] = useTransition();

  const cardsRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const vaccinationCount = transactions.filter((t) => t.transactionType === 'vaccination').length;
    const sterilizationCount = transactions.filter(
      (t) => t.transactionType === 'sterilization'
    ).length;
    const medicalCount = transactions.filter((t) => t.transactionType === 'medical').length;
    const emergencyCount = transactions.filter((t) => t.transactionType === 'emergency').length;
    const transferCount = transactions.filter((t) => t.transactionType === 'transfer').length;
    const createCount = transactions.filter((t) => t.transactionType === 'create').length;

    const rescueReasonCounts = transactions
      .filter((t) => t.transactionType === 'create')
      .reduce<Record<string, number>>((acc, transaction) => {
        const reason = transaction.changes?.after?.rescueReason ?? transaction.rescueReason;
        if (reason) acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

    const adoptionCount = transactions.filter(
      (t) => t.status === 'adoptado' || t.changes?.after?.status === 'adoptado'
    ).length;
    const returnCount = transactions.filter((t) => t.transactionType === 'return').length;
    const returnRate = adoptionCount > 0 ? Math.round((returnCount / adoptionCount) * 100) : 0;
    const followUpCount = transactions.filter((t) => t.transactionType === 'followup').length;

    const sumCostByType = (types: AnimalTransactionType['transactionType'][]): number =>
      transactions
        .filter((t) => types.includes(t.transactionType))
        .reduce((sum, t) => sum + (t.cost || 0), 0);

    const costBreakdown = [
      { label: 'Atención veterinaria', amount: sumCostByType(['medical', 'emergency']) },
      { label: 'Vacunaciones', amount: sumCostByType(['vaccination']) },
      { label: 'Castraciones', amount: sumCostByType(['sterilization']) },
      { label: 'Traslados', amount: sumCostByType(['transfer']) },
      { label: 'Suministros', amount: sumCostByType(['supply']) },
      {
        label: 'Otros',
        amount: transactions
          .filter(
            (t) =>
              t.transactionType !== 'medical' &&
              t.transactionType !== 'emergency' &&
              t.transactionType !== 'vaccination' &&
              t.transactionType !== 'sterilization' &&
              t.transactionType !== 'transfer' &&
              t.transactionType !== 'supply'
          )
          .reduce((sum, t) => sum + (t.cost || 0), 0),
      },
    ].filter((item) => item.amount > 0);

    const prolongedMedicalAnimalIds = new Set<string>();
    const medicalEventCountById = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.transactionType === 'medical' || t.transactionType === 'emergency') {
        medicalEventCountById.set(t.id, (medicalEventCountById.get(t.id) || 0) + 1);
      }
      if (t.changes?.after?.medicalConditions || t.medicalConditions) {
        prolongedMedicalAnimalIds.add(t.id);
      }
    });
    medicalEventCountById.forEach((count, id) => {
      if (count >= 2) prolongedMedicalAnimalIds.add(id);
    });

    return {
      vaccinationCount,
      sterilizationCount,
      medicalCount,
      emergencyCount,
      transferCount,
      createCount,
      rescueReasonCounts,
      adoptionCount,
      returnCount,
      returnRate,
      followUpCount,
      costBreakdown,
      prolongedMedicalCount: prolongedMedicalAnimalIds.size,
      uniqueAnimalCount: new Set(transactions.map((t) => t.id)).size,
      totalCost: transactions.reduce((sum, t) => sum + (t.cost || 0), 0),
    };
  }, [transactions]);

  const reportSummary = useMemo<ReportSummary>(
    () => ({
      periodo: {
        desde: formatToLocalDateString(dateFilter.startDate),
        hasta: formatToLocalDateString(dateFilter.endDate),
      },
      moneda: 'UYU',
      totalEventos: transactions.length,
      animalesIngresados: stats.createCount,
      casosAtendidos: stats.uniqueAnimalCount,
      adopciones: stats.adoptionCount,
      devoluciones: stats.returnCount,
      tasaDevoluciones: stats.returnRate,
      vacunaciones: stats.vaccinationCount,
      castraciones: stats.sterilizationCount,
      consultasMedicas: stats.medicalCount,
      emergencias: stats.emergencyCount,
      traslados: stats.transferCount,
      seguimientosDeAdopcion: stats.followUpCount,
      animalesConSeguimientoMedicoProlongado: stats.prolongedMedicalCount,
      rescatesPorMotivo: Object.fromEntries(
        Object.entries(stats.rescueReasonCounts).map(([reason, count]) => [
          getRescueReasonLabel(reason),
          count,
        ])
      ),
      gastoTotal: stats.totalCost,
      gastoPorCategoria: Object.fromEntries(
        stats.costBreakdown.map((item) => [item.label, item.amount])
      ),
    }),
    [transactions, dateFilter.startDate, dateFilter.endDate, stats]
  );

  useEffect(() => {
    const loadData = async () => {
      const start = Date.now();
      try {
        setLoading(true);
        setVisibleCount(VISIBLE_CARDS_STEP);
        const data = await getTransactionsByDateRange(dateFilter.startDate, dateFilter.endDate);
        startTransition(() => {
          setransactions(data);
        });
      } catch (error) {
        logger({
          level: 'error',
          code: 'LOAD_TRANSACTIONS',
          message: 'Error loading transactions:',
          data: error,
        });
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
          }, remaining);
        } else {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [searchControler, dateFilter.startDate, dateFilter.endDate]);

  // Animación de las cards cuando cargan los datos
  useGSAP(
    () => {
      if (loading || !transactions.length) return;

      // Animar las cards de estadísticas
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
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
            duration: 0.6,
            stagger: 0.15,
            ease: 'back.out(1.7)',
          }
        );
      }
    },
    { dependencies: [loading, transactions], scope: cardsRef }
  );

  return (
    <section className=" bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-2  items-center pb-28">
      {loading && <Loader />}
      <div className="w-full flex flex-col gap-4 items-center justify-start ">
        <div className="w-full flex justify-start">
          <div className="flex   bg-cream-light p-3 rounded">
            <Link
              href={'/plam-admin/animales'}
              className="flex items-center gap-2 px-2 text-gray-400 "
            >
              <FilterIcon size="md" title="Filtros activos" />
              <h3 className="text-2xl font-bold underline">Casos</h3>
            </Link>
            <div className="flex items-center gap-2 rounded p-2 bg-amber-sunset">
              <CalendarIcon size="md" className="text-gray-600" title="Calendario de adopciones" />
              <h4 className="text-2xl font-bold underline">Eventos</h4>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center bg-cream-light p-4 rounded">
          <h1 className="text-4xl font-bold underline">Linea del tiempo</h1>
          <div className="flex gap-4">
            <input
              className="bg-white px-2 rounded outline focus:outline-3 focus:outline-amber-sunset"
              type="date"
              value={formatToLocalDateString(pendingDateFilter.startDate)}
              onChange={(e) => {
                if (!e.target.value) {
                  setPendingDateFilter((prev) => ({
                    ...prev,
                    startDate: new Date().getTime() - 1 * 24 * 60 * 60 * 1000,
                  }));
                  return;
                }

                const [year, month, day] = e.target.value.split('-').map(Number);
                const uruguayDate = new Date(year, month - 1, day, 0, 0, 0, 0);

                setPendingDateFilter((prev) => ({
                  ...prev,
                  startDate: uruguayDate.getTime(),
                }));
              }}
            />
            <input
              className="bg-white px-2 rounded outline focus:outline-3 focus:outline-amber-sunset"
              type="date"
              value={formatToLocalDateString(pendingDateFilter.endDate)}
              onChange={(e) => {
                if (!e.target.value) {
                  setPendingDateFilter((prev) => ({
                    ...prev,
                    endDate: new Date().getTime(),
                  }));
                  return;
                }

                const [year, month, day] = e.target.value.split('-').map(Number);
                const uruguayDate = new Date(year, month - 1, day, 23, 59, 59, 999);

                setPendingDateFilter((prev) => ({
                  ...prev,
                  endDate: uruguayDate.getTime(),
                }));
              }}
            />
            <button
              className="rounded px-4 p-2 bg-black text-white"
              onClick={() => {
                setDateFilter(pendingDateFilter);
                setSearchControler((prev) => !prev);
              }}
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
      <section className="w-full mb-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Estadísticas del Período
        </h2>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Total de Eventos</h3>
            <p className="text-7xl text-white">{transactions.length}</p>
            <p className="text-sm text-cream-light mt-1">Transacciones registradas</p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Total de animales ingresados</h3>
            <p className="text-7xl text-white">{stats.createCount}</p>
            <p className="text-sm text-cream-light mt-1">Casos nuevos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye ingresos anteriores al 01/12/25)
              </p>
            )}
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Casos Atendidos</h3>
            <p className="text-7xl text-white">{stats.uniqueAnimalCount}</p>
            <p className="text-sm text-cream-light mt-1">Animales únicos</p>
          </div>

          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg ">
            <h3 className="text-lg text-black mb-2">Adopciones</h3>
            <p className="text-7xl text-black">{stats.adoptionCount}</p>
            <p className="text-sm text-green-dark mt-1">Con familia nueva</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Vacunaciones</h3>
            <p className="text-7xl text-white">{stats.vaccinationCount}</p>
            <p className="text-sm text-cream-light mt-1">Eventos registrados</p>
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Castraciones</h3>
            <p className="text-7xl text-white">{stats.sterilizationCount}</p>
            <p className="text-sm text-cream-light mt-1">Procedimientos registrados</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-black mb-2">Consultas médicas</h3>
            <p className="text-7xl text-black">{stats.medicalCount}</p>
            <p className="text-sm text-green-dark mt-1">Eventos médicos registrados</p>
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Emergencias</h3>
            <p className="text-7xl text-white">{stats.emergencyCount}</p>
            <p className="text-sm text-cream-light mt-1">Casos de urgencia</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Traslados</h3>
            <p className="text-7xl text-white">{stats.transferCount}</p>
            <p className="text-sm text-cream-light mt-1">Traslados sanitarios</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Devoluciones</h3>
            <p className="text-7xl text-white">{stats.returnCount}</p>
            <p className="text-sm text-cream-light mt-1">
              {stats.returnRate}% de las adopciones del período
            </p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Seguimientos de adopción</h3>
            <p className="text-7xl text-white">{stats.followUpCount}</p>
            <p className="text-sm text-cream-light mt-1">Contactos post-adopción</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-black mb-2">Seguimiento médico prolongado</h3>
            <p className="text-7xl text-black">{stats.prolongedMedicalCount}</p>
            <p className="text-sm text-green-dark mt-1">Animales con ≥2 atenciones o patología</p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-3">Rescates por motivo</h3>
            {Object.keys(stats.rescueReasonCounts).length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {Object.entries(stats.rescueReasonCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <li key={reason} className="flex items-center justify-between text-white">
                      <span className="text-sm text-cream-light">
                        {getRescueReasonLabel(reason)}
                      </span>
                      <span className="font-bold text-2xl">{count}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-cream-light">Sin registros en el período</p>
            )}
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-3">Gasto por categoría</h3>
            {stats.costBreakdown.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {stats.costBreakdown.map((item) => (
                  <li key={item.label} className="flex items-center justify-between text-white">
                    <span className="text-sm text-cream-light">{item.label}</span>
                    <span className="font-bold">${item.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-cream-light">Sin gastos en el período</p>
            )}
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg sm:col-span-2">
            <h3 className="text-lg text-white mb-2">Deuda Generada</h3>
            <p className="text-7xl text-white">${stats.totalCost}</p>
            <p className="text-sm text-cream-light mt-1">Total en gastos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye gastos anteriores al 01/12/25)
              </p>
            )}
          </div>
        </div>
        <ReportSection reportSummary={reportSummary} />
      </section>
      <ul className="flex flex-col max-w-3xl  ">
        {transactions.slice(0, visibleCount).map((transaction, index) => (
          <li className="  border-l-2 relative pt-6 pl-2 " key={transaction.id + index}>
            <TransactionCard transaction={transaction} showImg showAnimalLink />
          </li>
        ))}
      </ul>
      {visibleCount < transactions.length && (
        <button
          onClick={() => setVisibleCount((prev) => prev + VISIBLE_CARDS_STEP)}
          className="rounded-lg px-6 py-2 bg-green-dark text-white font-semibold hover:bg-green-forest transition"
        >
          Ver más ({transactions.length - visibleCount} restantes)
        </button>
      )}
    </section>
  );
}
