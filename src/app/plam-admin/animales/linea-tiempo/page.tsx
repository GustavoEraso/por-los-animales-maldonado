'use client';
import { CalendarIcon, FilterIcon } from '@/components/Icons';
import Loader from '@/components/Loader';
import TransactionCard from '@/components/TransactionCard';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { getRescueReasonLabel } from '@/lib/constants/animalLabels';
import { handleToast } from '@/lib/handleToast';
import { ReportSummary } from '@/lib/reportGenerator';
import { AnimalTransactionType } from '@/types';
import Link from 'next/dist/client/link';
import { useEffect, useState, useRef } from 'react';
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
  const MIN_LOADING_TIME = 600;

  const [reportVersions, setReportVersions] = useState<string[]>([]);
  const [currentReportIndex, setCurrentReportIndex] = useState<number>(-1);
  const report = currentReportIndex >= 0 ? (reportVersions[currentReportIndex] ?? '') : '';
  const [reportError, setReportError] = useState<string>('');
  const [reportInstruction, setReportInstruction] = useState<string>('');
  const [extraContext, setExtraContext] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isRefiningReport, setIsRefiningReport] = useState<boolean>(false);

  const cardsRef = useRef<HTMLDivElement>(null);
  const vaccinationCount = transactions.filter((t) => t.transactionType === 'vaccination').length;
  const sterilizationCount = transactions.filter(
    (t) => t.transactionType === 'sterilization'
  ).length;
  const medicalCount = transactions.filter((t) => t.transactionType === 'medical').length;
  const emergencyCount = transactions.filter((t) => t.transactionType === 'emergency').length;
  const transferCount = transactions.filter((t) => t.transactionType === 'transfer').length;

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
  const prolongedMedicalCount = prolongedMedicalAnimalIds.size;

  const buildReportSummary = (): ReportSummary => ({
    periodo: {
      desde: formatToLocalDateString(dateFilter.startDate),
      hasta: formatToLocalDateString(dateFilter.endDate),
    },
    moneda: 'UYU',
    totalEventos: transactions.length,
    animalesIngresados: transactions.filter((t) => t.transactionType === 'create').length,
    casosAtendidos: new Set(transactions.map((t) => t.id)).size,
    adopciones: adoptionCount,
    devoluciones: returnCount,
    tasaDevoluciones: returnRate,
    vacunaciones: vaccinationCount,
    castraciones: sterilizationCount,
    consultasMedicas: medicalCount,
    emergencias: emergencyCount,
    traslados: transferCount,
    seguimientosDeAdopcion: followUpCount,
    animalesConSeguimientoMedicoProlongado: prolongedMedicalCount,
    rescatesPorMotivo: Object.fromEntries(
      Object.entries(rescueReasonCounts).map(([reason, count]) => [
        getRescueReasonLabel(reason),
        count,
      ])
    ),
    gastoTotal: transactions.reduce((sum, t) => sum + (t.cost || 0), 0),
    gastoPorCategoria: Object.fromEntries(costBreakdown.map((item) => [item.label, item.amount])),
  });

  const handleGenerateReport = async (): Promise<void> => {
    if (isGeneratingReport) return;
    setReportVersions([]);
    setCurrentReportIndex(-1);
    setReportError('');
    setIsGeneratingReport(true);
    const start = Date.now();
    try {
      const response = await fetch('/api/reporte-impacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || '',
        },
        body: JSON.stringify({ summary: buildReportSummary(), extraContext }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          errorData?.error || 'No se pudo generar el informe. Intentá de nuevo en unos minutos.'
        );
      }

      const data = (await response.json()) as { report: string };
      setReportVersions([data.report]);
      setCurrentReportIndex(0);
    } catch (error) {
      logger({
        level: 'error',
        code: 'GENERATE_REPORT',
        message: 'Error generating impact report:',
        data: error,
      });
      const friendlyMessage =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo generar el informe. Intentá de nuevo en unos minutos.';
      setReportError(friendlyMessage);
      handleToast({
        type: 'warning',
        title: 'Ups',
        text: friendlyMessage,
      });
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsGeneratingReport(false), remaining);
      } else {
        setIsGeneratingReport(false);
      }
    }
  };

  const clearReport = (): void => {
    setReportVersions([]);
    setCurrentReportIndex(-1);
    setReportError('');
    setReportInstruction('');
  };

  const showPreviousReportVersion = (): void => {
    if (currentReportIndex <= 0) return;
    setCurrentReportIndex((prev) => prev - 1);
  };

  const showNextReportVersion = (): void => {
    if (currentReportIndex >= reportVersions.length - 1) return;
    setCurrentReportIndex((prev) => prev + 1);
  };

  const handleRefineReport = async (): Promise<void> => {
    const instruction = reportInstruction.trim();
    if (!instruction || isRefiningReport || isGeneratingReport) return;
    setIsRefiningReport(true);
    setReportError('');
    const start = Date.now();
    try {
      const response = await fetch('/api/reporte-impacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || '',
        },
        body: JSON.stringify({
          summary: buildReportSummary(),
          previousReport: report,
          instruction,
          extraContext,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          errorData?.error || 'No se pudo reformular el informe. Intentá de nuevo en unos minutos.'
        );
      }

      const data = (await response.json()) as { report: string };
      setReportVersions((prev) => [...prev, data.report]);
      setCurrentReportIndex(reportVersions.length);
      setReportInstruction('');
    } catch (error) {
      logger({
        level: 'error',
        code: 'REFINE_REPORT',
        message: 'Error refining impact report:',
        data: error,
      });
      const friendlyMessage =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo reformular el informe. Intentá de nuevo en unos minutos.';
      setReportError(friendlyMessage);
      handleToast({
        type: 'warning',
        title: 'Ups',
        text: friendlyMessage,
      });
    } finally {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsRefiningReport(false), remaining);
      } else {
        setIsRefiningReport(false);
      }
    }
  };

  const handleCopyReport = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(report);
      handleToast({
        type: 'success',
        title: 'Copiado',
        text: 'El informe se copió al portapapeles',
      });
    } catch {
      handleToast({ type: 'error', title: 'Error', text: 'No se pudo copiar el informe' });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const start = Date.now();
      try {
        setLoading(true);
        const data = await getFirestoreData({
          currentCollection: 'animalTransactions',
          orderBy: 'date',
          direction: 'desc',
          filter: [
            ['date', '>=', dateFilter.startDate],
            ['date', '<=', dateFilter.endDate],
          ],
        });
        setransactions(data);
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
            <p className="text-7xl text-white">
              {transactions.filter((t) => t.transactionType === 'create').length}
            </p>
            <p className="text-sm text-cream-light mt-1">Casos nuevos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye ingresos anteriores al 01/12/25)
              </p>
            )}
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Casos Atendidos</h3>
            <p className="text-7xl text-white">{new Set(transactions.map((t) => t.id)).size}</p>
            <p className="text-sm text-cream-light mt-1">Animales únicos</p>
          </div>

          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg ">
            <h3 className="text-lg text-black mb-2">Adopciones</h3>
            <p className="text-7xl text-black">
              {
                transactions.filter(
                  (t) => t.status === 'adoptado' || t.changes?.after?.status === 'adoptado'
                ).length
              }
            </p>
            <p className="text-sm text-green-dark mt-1">Con familia nueva</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Vacunaciones</h3>
            <p className="text-7xl text-white">{vaccinationCount}</p>
            <p className="text-sm text-cream-light mt-1">Eventos registrados</p>
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Castraciones</h3>
            <p className="text-7xl text-white">{sterilizationCount}</p>
            <p className="text-sm text-cream-light mt-1">Procedimientos registrados</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-black mb-2">Consultas médicas</h3>
            <p className="text-7xl text-black">{medicalCount}</p>
            <p className="text-sm text-green-dark mt-1">Eventos médicos registrados</p>
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Emergencias</h3>
            <p className="text-7xl text-white">{emergencyCount}</p>
            <p className="text-sm text-cream-light mt-1">Casos de urgencia</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Traslados</h3>
            <p className="text-7xl text-white">{transferCount}</p>
            <p className="text-sm text-cream-light mt-1">Traslados sanitarios</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Devoluciones</h3>
            <p className="text-7xl text-white">{returnCount}</p>
            <p className="text-sm text-cream-light mt-1">
              {returnRate}% de las adopciones del período
            </p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Seguimientos de adopción</h3>
            <p className="text-7xl text-white">{followUpCount}</p>
            <p className="text-sm text-cream-light mt-1">Contactos post-adopción</p>
          </div>
          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-black mb-2">Seguimiento médico prolongado</h3>
            <p className="text-7xl text-black">{prolongedMedicalCount}</p>
            <p className="text-sm text-green-dark mt-1">Animales con ≥2 atenciones o patología</p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-3">Rescates por motivo</h3>
            {Object.keys(rescueReasonCounts).length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {Object.entries(rescueReasonCounts)
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
            {costBreakdown.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {costBreakdown.map((item) => (
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
            <p className="text-7xl text-white">
              ${transactions.reduce((sum, t) => sum + (t.cost || 0), 0)}
            </p>
            <p className="text-sm text-cream-light mt-1">Total en gastos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye gastos anteriores al 01/12/25)
              </p>
            )}
          </div>
        </div>
        <div className="w-full flex justify-center mt-6">
          {isGeneratingReport || report || reportError ? (
            <section className="w-full flex flex-col items-center">
              <div className="w-full max-w-2xl flex flex-col gap-4 bg-white border border-green-dark/20 rounded-2xl shadow-md p-4">
                {isGeneratingReport ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <Loader />
                    <p className="text-gray-600">Generando informe con IA...</p>
                  </div>
                ) : report ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-green-dark">Informe de Impacto</h3>
                        {reportVersions.length > 1 && (
                          <div className="flex items-center gap-1 rounded-lg border border-green-dark/20 bg-cream-light px-2 py-1">
                            <button
                              onClick={showPreviousReportVersion}
                              disabled={currentReportIndex <= 0 || isRefiningReport}
                              title="Versión anterior"
                              className="px-1.5 py-0.5 text-lg font-bold text-green-dark hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              ‹
                            </button>
                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                              {currentReportIndex + 1} / {reportVersions.length}
                            </span>
                            <button
                              onClick={showNextReportVersion}
                              disabled={
                                currentReportIndex >= reportVersions.length - 1 || isRefiningReport
                              }
                              title="Versión siguiente"
                              className="px-1.5 py-0.5 text-lg font-bold text-green-dark hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              ›
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyReport}
                          className="rounded-lg px-4 py-2 bg-amber-sunset text-white font-semibold hover:bg-caramel-deep transition"
                        >
                          Copiar
                        </button>
                        <button
                          onClick={clearReport}
                          title="Cerrar informe"
                          className="rounded-lg px-3 py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                    <textarea
                      readOnly
                      value={report}
                      rows={14}
                      className="w-full bg-cream-light border border-green-dark/20 rounded-lg p-3 text-sm leading-relaxed resize-y focus:outline-none"
                    />
                    <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
                      <label
                        htmlFor="report-instruction"
                        className="text-sm font-semibold text-gray-700"
                      >
                        ¿Querés modificar o agregar más información?
                      </label>
                      <textarea
                        id="report-instruction"
                        value={reportInstruction}
                        onChange={(e) => setReportInstruction(e.target.value)}
                        rows={3}
                        placeholder="Ej: 'quitá el detalle de gastos' o 'agregá que realizamos traslados sanitarios'"
                        className="w-full bg-white border border-green-dark/20 rounded-lg p-3 text-sm leading-relaxed resize-y focus:outline-none"
                      />
                      <button
                        onClick={handleRefineReport}
                        disabled={!reportInstruction.trim() || isRefiningReport}
                        className="w-fit self-end rounded-lg px-6 py-2 bg-green-dark text-white font-semibold hover:bg-green-forest transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isRefiningReport ? 'Reformulando...' : 'Reformular informe'}
                      </button>
                    </div>
                  </>
                ) : reportError ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <p className="text-lg font-semibold text-amber-600">
                      Ups, no pudimos generar el informe
                    </p>
                    <p className="text-gray-600 max-w-md">{reportError}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateReport}
                        className="rounded-lg px-6 py-2 bg-green-dark text-white font-semibold hover:bg-green-forest transition"
                      >
                        Reintentar
                      </button>
                      <button
                        onClick={clearReport}
                        className="rounded-lg px-3 py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : (
            <div className="w-full max-w-2xl flex flex-col gap-4 bg-white border border-green-dark/20 rounded-2xl shadow-md p-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="extra-context" className="text-sm font-semibold text-gray-700">
                  Información adicional que no esté en el sistema (opcional)
                </label>
                <textarea
                  id="extra-context"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  rows={3}
                  placeholder="Ej: participaron 19 voluntarios, se realizaron traslados sanitarios a veterinarias..."
                  className="w-full bg-white border border-green-dark/20 rounded-lg p-3 text-sm leading-relaxed resize-y focus:outline-none"
                />
                <p className="text-xs text-gray-500">
                  Esta información se incluirá en el informe generado.
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full sm:w-auto self-center rounded-lg px-8 py-2.5 bg-green-dark text-white font-semibold hover:bg-green-forest transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingReport ? 'Generando...' : 'Generar informe'}
              </button>
            </div>
          )}
        </div>
      </section>
      <ul className="flex flex-col max-w-3xl  ">
        {transactions.map((transaction, index) => (
          <li className="  border-l-2 relative pt-6 pl-2 " key={transaction.id + index}>
            <TransactionCard transaction={transaction} showImg showAnimalLink />
          </li>
        ))}
      </ul>
    </section>
  );
}
