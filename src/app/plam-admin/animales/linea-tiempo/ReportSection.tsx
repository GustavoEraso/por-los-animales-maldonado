'use client';

import { useState } from 'react';
import Loader from '@/components/Loader';
import { ReportSummary } from '@/lib/reportGenerator';
import { handleToast } from '@/lib/handleToast';
import { logger } from '@/lib/logger';

const MIN_LOADING_TIME = 600;

/**
 * ReportSection manages the impact report generation UI: extra context input,
 * report display with version navigation, refinement instructions and copy actions.
 *
 * Keeps all report-related state isolated so typing does not re-render the parent page.
 *
 * @param reportSummary - Summary of the current period statistics used as report input
 * @returns React element with the report panel
 *
 * @example
 * <ReportSection reportSummary={memoizedReportSummary} />
 */
export default function ReportSection({
  reportSummary,
}: {
  reportSummary: ReportSummary;
}): React.ReactElement {
  const [reportVersions, setReportVersions] = useState<string[]>([]);
  const [currentReportIndex, setCurrentReportIndex] = useState<number>(-1);
  const report = currentReportIndex >= 0 ? (reportVersions[currentReportIndex] ?? '') : '';
  const [reportError, setReportError] = useState<string>('');
  const [reportInstruction, setReportInstruction] = useState<string>('');
  const [extraContext, setExtraContext] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isRefiningReport, setIsRefiningReport] = useState<boolean>(false);

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
        body: JSON.stringify({ summary: reportSummary, extraContext }),
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
          summary: reportSummary,
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

  return (
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
  );
}
