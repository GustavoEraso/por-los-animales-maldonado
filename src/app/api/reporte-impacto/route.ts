import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { generateImpactReport, ReportSummary } from '@/lib/reportGenerator';

const REPORT_TIMEOUT_MS = 30000;

const MAX_EXTRA_CONTEXT_LENGTH = 2000;
const MAX_INSTRUCTION_LENGTH = 2000;
const MAX_PREVIOUS_REPORT_LENGTH = 10000;

// Basic in-memory rate limiting to reduce AI cost abuse.
// Note: per-instance in serverless environments; adds friction, not a hard guarantee.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface ReportRequestBody {
  summary: ReportSummary;
  /** Current report narrative to refine (optional, used when iterating). */
  previousReport?: string;
  /** Free-text instruction to modify/add information to the report. */
  instruction?: string;
  /** Extra information provided by the organization that is not in the system (e.g. volunteer count). */
  extraContext?: string;
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientKey);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function isOptionalString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * POST /api/reporte-impacto - Generate or refine an impact report narrative.
 *
 * Internal API endpoint that converts verified activity statistics into an impact
 * report narrative using AI (Gemini with Groq fallback). Optionally refines an
 * existing report using a free-text instruction. Used by the admin timeline page.
 *
 * @headers {string} x-internal-token - Required internal API secret token for authentication
 *
 * @body {ReportRequestBody} - JSON with the activity summary and optional refinement data
 *
 * @returns {NextResponse<{ report: string }>} 200 with the generated/refined narrative
 * @returns {NextResponse<{ error: string }>} 401 if token is invalid or missing
 * @returns {NextResponse<{ error: string }>} 429 if rate limited or AI providers are rate-limited
 * @returns {NextResponse<{ error: string }>} 400 if the body is not a valid summary
 * @returns {NextResponse<{ error: string }>} 500 if AI generation fails or times out
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INTERNAL_API_SECRET) {
    logger({ level: 'warn', code: 'UNAUTHORIZED', message: 'Invalid report token' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(clientIp)) {
    logger({ level: 'warn', code: 'RATE_LIMITED', message: 'Report endpoint rate limited' });
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intentá de nuevo en unos minutos.' },
      { status: 429 }
    );
  }

  let body: ReportRequestBody;
  try {
    body = (await req.json()) as ReportRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const summary = body?.summary;
  if (!summary?.periodo || typeof summary.totalEventos !== 'number') {
    return NextResponse.json({ error: 'Missing report summary data' }, { status: 400 });
  }

  const previousReport = body.previousReport;
  const instruction = body.instruction;
  const extraContext = body.extraContext;

  if (
    (previousReport !== undefined && !isOptionalString(previousReport)) ||
    (instruction !== undefined && !isOptionalString(instruction)) ||
    (extraContext !== undefined && !isOptionalString(extraContext))
  ) {
    return NextResponse.json({ error: 'Invalid field types' }, { status: 400 });
  }

  if (
    (extraContext?.length ?? 0) > MAX_EXTRA_CONTEXT_LENGTH ||
    (instruction?.length ?? 0) > MAX_INSTRUCTION_LENGTH ||
    (previousReport?.length ?? 0) > MAX_PREVIOUS_REPORT_LENGTH
  ) {
    return NextResponse.json({ error: 'Request too large' }, { status: 400 });
  }

  try {
    const result = await Promise.race([
      generateImpactReport(summary, {
        previousReport,
        instruction,
        extraContext,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), REPORT_TIMEOUT_MS)),
    ]);

    if (result?.report) {
      return NextResponse.json({ report: result.report });
    }

    if (result?.rateLimited) {
      return NextResponse.json(
        {
          error: 'Se alcanzó el límite de solicitudes de la IA. Intentá de nuevo en unos minutos.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'No se pudo generar el informe. Intentá de nuevo en unos minutos.' },
      { status: 500 }
    );
  } catch (error) {
    logger({
      level: 'error',
      code: 'REPORT_GENERATION_FAILED',
      message: 'Error generating impact report:',
      data: error,
    });
    return NextResponse.json(
      { error: 'No se pudo generar el informe. Intentá de nuevo en unos minutos.' },
      { status: 500 }
    );
  }
}
