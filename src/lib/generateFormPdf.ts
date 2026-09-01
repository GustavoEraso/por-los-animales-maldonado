import { jsPDF } from 'jspdf';
import type { GoogleFormEntry, GoogleFormEvaluation } from '@/types';
import { getFormFieldDefinitions, resolveFormVersion } from '@/lib/googleForms/formPresentation';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Brand colors — synced with globals.css custom properties
// ---------------------------------------------------------------------------

const GREEN_DARK = '#283618';
const GREEN_FOREST = '#606c38';
const CREAM_LIGHT = '#fefae0';
const CARAMEL_DEEP = '#bc6c25';
const TEXT_DARK = '#1a1a1a';
const TEXT_MUTED = '#555555';
const BORDER_LIGHT = '#e0d8c8';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PdfColors {
  scoreBg: string;
  scoreText: string;
  recBg: string;
  recText: string;
  recBorder: string;
}

/**
 * Returns color scheme for the score/recommendation badges based on score value.
 */
function scoreColors(score: number): PdfColors {
  if (score >= 80) {
    return {
      scoreBg: '#dcfce7',
      scoreText: '#166534',
      recBg: '#f0fdf4',
      recText: '#166534',
      recBorder: '#86efac',
    };
  }
  if (score >= 60) {
    return {
      scoreBg: '#fef3c7',
      scoreText: '#92400e',
      recBg: '#fffbeb',
      recText: '#92400e',
      recBorder: '#fcd34d',
    };
  }
  return {
    scoreBg: '#fee2e2',
    scoreText: '#991b1b',
    recBg: '#fef2f2',
    recText: '#991b1b',
    recBorder: '#fca5a5',
  };
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  high: 'Alta compatibilidad',
  medium: 'Compatibilidad media',
  low: 'Baja compatibilidad',
};

/**
 * Loads an image from a URL and returns a PNG data URL suitable for jsPDF.addImage().
 * Converts from any browser-supported format (including WebP) to PNG,
 * which jsPDF handles reliably without pixelation.
 */
async function loadImageDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use native dimensions for maximum sharpness
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      // PNG ensures jsPDF renders without pixelation artifacts
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// PDF sections
// ---------------------------------------------------------------------------

interface DrawHeaderParams {
  doc: jsPDF;
  y: number;
  logoDataUrl: string | null;
  form: GoogleFormEntry;
}

/**
 * Draws the header section: logo, org name, document title, applicant info.
 * Returns the y position after the header.
 */
function drawHeader({ doc, y, logoDataUrl, form }: DrawHeaderParams): number {
  // Top bar background
  doc.setFillColor(GREEN_DARK);
  doc.rect(0, 0, PAGE_W, 32, 'F');

  // Logo (if available)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MARGIN, 4, 18, 18);
    } catch {
      // Logo load failed — continue without it
    }
  }

  // Org name in top bar
  doc.setTextColor('#ffffff');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('porlosanimalesmaldonado', logoDataUrl ? MARGIN + 21 : MARGIN, 14);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Formulario de Adopción', logoDataUrl ? MARGIN + 21 : MARGIN, 20);

  y = 40;

  // Applicant info card
  doc.setFillColor(CREAM_LIGHT);
  doc.setDrawColor(BORDER_LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 24, 3, 3, 'FD');

  doc.setTextColor(TEXT_DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(form.fullName ?? '—', MARGIN + 5, y + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_MUTED);
  const dateStr = form.createdAt
    ? new Date(form.createdAt).toLocaleDateString('es-UY', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';
  const petLine = form.selectedPet ? ` · Mascota: ${form.selectedPet}` : '';
  doc.text(`Recibido: ${dateStr}${petLine}`, MARGIN + 5, y + 16);

  return y + 32;
}

interface DrawEvaluationParams {
  doc: jsPDF;
  y: number;
  evaluation: GoogleFormEvaluation;
}

/**
 * Draws the sof-IA evaluation section: score, recommendation, summary,
 * strengths, concerns, missing information, and preferences.
 * Returns the y position after the section.
 */
function drawEvaluation({ doc, y, evaluation }: DrawEvaluationParams): number {
  const colors = scoreColors(evaluation.score);

  // Section title
  doc.setFillColor(CARAMEL_DEEP);
  doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EVALUACIÓN sof-IA', MARGIN + 4, y + 5.5);

  y += 14;

  // Score + recommendation row
  const scoreW = 28;
  const recW = CONTENT_W - scoreW - 6;

  // Score box
  doc.setFillColor(colors.scoreBg);
  doc.roundedRect(MARGIN, y, scoreW, 18, 3, 3, 'F');
  doc.setTextColor(colors.scoreText);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(evaluation.score), MARGIN + scoreW / 2, y + 13, { align: 'center' });

  // Recommendation box
  doc.setFillColor(colors.recBg);
  doc.setDrawColor(colors.recBorder);
  doc.roundedRect(MARGIN + scoreW + 4, y, recW - 2, 18, 3, 3, 'FD');
  doc.setTextColor(colors.recText);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const recLabel = RECOMMENDATION_LABELS[evaluation.recommendation] ?? evaluation.recommendation;
  doc.text(recLabel, MARGIN + scoreW + 10, y + 12);

  y += 24;

  // Summary
  if (evaluation.summary) {
    doc.setTextColor(TEXT_DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const summaryLines = doc.splitTextToSize(evaluation.summary, CONTENT_W - 6);
    doc.text(summaryLines, MARGIN + 3, y);
    y += summaryLines.length * 5 + 5;
  }

  // Strengths & Concerns — two columns
  const colW = (CONTENT_W - 6) / 2;

  // Left: Strengths
  const strengthsLines = drawBulletList(
    doc,
    'Fortalezas',
    GREEN_FOREST,
    evaluation.strengths,
    MARGIN,
    y,
    colW
  );
  // Right: Concerns
  const concernsLines = drawBulletList(
    doc,
    'Riesgos',
    '#dc2626',
    evaluation.concerns,
    MARGIN + colW + 4,
    y,
    colW
  );

  y += Math.max(strengthsLines, concernsLines) * 5 + 12;

  // Missing information
  if (evaluation.missingInformation.length > 0) {
    doc.setFillColor('#fef2f2');
    doc.roundedRect(MARGIN, y, CONTENT_W, 7, 2, 2, 'F');
    doc.setTextColor('#991b1b');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN FALTANTE', MARGIN + 3, y + 5);

    y += 11;

    for (const item of evaluation.missingInformation) {
      doc.setTextColor(TEXT_DARK);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(`• ${item}`, CONTENT_W - 4);
      doc.text(lines, MARGIN + 3, y);
      y += lines.length * 4.5 + 1;
    }
    y += 2;
  }

  // Preferences
  y += 2;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_MUTED);
  doc.text('Preferencias detectadas:', MARGIN + 2, y);
  y += 5;

  const prefs = evaluation.preferences;
  const prefTags: string[] = [];
  if (prefs.species && prefs.species !== 'cualquiera') prefTags.push(`Especie: ${prefs.species}`);
  if (prefs.size && prefs.size !== 'cualquiera') prefTags.push(`Tamaño: ${prefs.size}`);
  if (prefs.hasYard) prefTags.push('Tiene patio');
  if (prefs.hasKids) prefTags.push('Convive con niños');
  if (prefs.hasOtherDogs) prefTags.push('Convive con perros');
  if (prefs.hasOtherCats) prefTags.push('Convive con gatos');

  if (prefTags.length > 0) {
    const tagLine = prefTags.join('  ·  ');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED);
    doc.text(tagLine, MARGIN + 2, y);
    y += 5;
  }

  return y + 4;
}

/**
 * Draws a titled bullet list in a column. Returns the number of text lines used.
 */
function drawBulletList(
  doc: jsPDF,
  title: string,
  color: string,
  items: string[],
  x: number,
  startY: number,
  width: number
): number {
  let y = startY;

  // Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color);
  doc.text(title, x + 1, y);
  y += 5;

  // Items
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  let totalLines = 1;

  for (const item of items) {
    doc.setTextColor(TEXT_DARK);
    const lines = doc.splitTextToSize(`• ${item}`, width - 2);
    doc.text(lines, x + 2, y);
    const lineCount = lines.length;
    y += lineCount * 4.5 + 1;
    totalLines += lineCount;
  }

  return totalLines;
}

interface DrawResponsesParams {
  doc: jsPDF;
  y: number;
  form: GoogleFormEntry;
}

/**
 * Draws the complete responses section in Q&A format.
 * Handles page breaks. Returns the final y position.
 */
function drawResponses({ doc, y, form }: DrawResponsesParams): number {
  // Section title
  doc.setFillColor(GREEN_FOREST);
  doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RESPUESTAS COMPLETAS', MARGIN + 4, y + 5.5);

  y += 14;

  // Use the version-aware ordered presentation so the PDF matches the
  // administrative interface for both legacy and v2 forms.
  const version = resolveFormVersion(form);
  const fieldDefinitions = getFormFieldDefinitions(version);

  for (const { field, label } of fieldDefinitions) {
    const rawValue = form[field];
    const value = typeof rawValue === 'string' ? rawValue : '';
    if (!value.trim()) continue;

    const question = label;

    // Page break check — need at least 20mm for question + first line of answer
    if (y > PAGE_H - 25) {
      doc.addPage();
      y = MARGIN;
    }

    // Question
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GREEN_DARK);
    const qLines = doc.splitTextToSize(question, CONTENT_W - 4);
    doc.text(qLines, MARGIN + 2, y);
    y += qLines.length * 4.5 + 2;

    // Answer
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_DARK);
    const aLines = doc.splitTextToSize(value, CONTENT_W - 8);
    doc.text(aLines, MARGIN + 4, y);
    y += aLines.length * 4.5 + 3;

    // Separator with padding on both sides
    doc.setDrawColor(BORDER_LIGHT);
    doc.line(MARGIN + 4, y, MARGIN + CONTENT_W - 2, y);
    y += 4;
  }

  return y;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates and downloads a PDF with the adoption form's evaluation and
 * complete responses.
 *
 * The PDF includes:
 * - Header with org branding and applicant info
 * - sof-IA evaluation (score, recommendation, summary, strengths, concerns, preferences)
 * - Complete Q&A responses
 *
 * @param form - The full GoogleFormEntry with evaluation and fields
 * @param logoUrl - Optional URL to the org logo (e.g. '/logo300.webp')
 *
 * @example
 * await downloadFormPdf(form, '/logo300.webp');
 */
export async function downloadFormPdf(
  form: GoogleFormEntry,
  logoUrl: string = '/logo300.webp'
): Promise<void> {
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageDataUrl(logoUrl);
  } catch {
    // Logo optional — continue without it
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // ── Header ──
  y = drawHeader({ doc, y, logoDataUrl, form });

  // ── Evaluation ──
  if (form.evaluation) {
    drawEvaluation({ doc, y, evaluation: form.evaluation });
  }

  // ── Responses (always start on a fresh page) ──
  doc.addPage();
  drawResponses({ doc, y: MARGIN, form });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED);
    doc.text(`porlosanimalesmaldonado · Página ${i} de ${pageCount}`, PAGE_W / 2, PAGE_H - 8, {
      align: 'center',
    });
  }

  // ── Download ──
  const fileName = `formulario-${form.fullName?.replace(/\s+/g, '-').toLowerCase() ?? form.id}.pdf`;
  doc.save(fileName);

  logger({
    level: 'info',
    code: 'PDF_DOWNLOAD',
    message: `PDF generated for form ${form.id}`,
  });
}
