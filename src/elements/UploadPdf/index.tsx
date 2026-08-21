'use client';

import React from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import type {
  CloudinaryUploadWidgetInfo,
  CloudinaryUploadWidgetOptions,
  CloudinaryUploadWidgetResults,
} from 'next-cloudinary';
import type { PdfMetadata } from '@/types';
import { UploadIcon } from '@/components/Icons';
import { handleToast } from '@/lib/handleToast';

interface UploadPdfProps {
  /** Callback invoked for every PDF successfully uploaded to Cloudinary. */
  onPdfsAdd: (pdfs: PdfMetadata[]) => void;
  /** Optional maximum number of files accepted by the Cloudinary widget. */
  maxFiles?: number;
}

const CLOUDINARY_PDF_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET_EVENT_PDF || 'event-pdf';

/**
 * Uploads one or more PDF documents to Cloudinary as image resources.
 *
 * @example
 * ```tsx
 * <UploadPdf onPdfsAdd={(pdfs) => setEventPdfs((current) => [...current, ...pdfs])} />
 * ```
 */
export default function UploadPdf({ onPdfsAdd, maxFiles }: UploadPdfProps): React.ReactElement {
  const widgetOptions: CloudinaryUploadWidgetOptions = {
    resourceType: 'image',
    sources: ['local'],
    multiple: true,
    clientAllowedFormats: ['pdf'],
    ...(maxFiles !== undefined && { maxFiles }),
  };

  const resetBodyOverflow = (): void => {
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }, 100);
  };

  const handleUpload = (result: CloudinaryUploadWidgetResults): void => {
    if (result.event !== 'success' || typeof result.info === 'string' || !result.info) return;

    const info: CloudinaryUploadWidgetInfo = result.info;
    const format = typeof info.format === 'string' ? info.format.toLowerCase() : '';
    const secureUrl = typeof info.secure_url === 'string' ? info.secure_url.trim() : '';
    const publicId = typeof info.public_id === 'string' ? info.public_id.trim() : '';
    const originalFileName =
      typeof info.original_filename === 'string' ? info.original_filename.trim() : '';
    const hasPdfExtension =
      originalFileName.toLowerCase().endsWith('.pdf') || publicId.toLowerCase().endsWith('.pdf');
    const isPdf = format === 'pdf' || (format === '' && hasPdfExtension);

    if (info.resource_type !== 'image' || !isPdf || !secureUrl || !publicId) {
      handleToast({
        type: 'error',
        title: 'Archivo inválido',
        text: 'Solo se pueden adjuntar archivos PDF',
      });
      resetBodyOverflow();
      return;
    }

    const fallbackFileName = publicId.split('/').pop() || 'documento.pdf';
    const fileNameBase = originalFileName || fallbackFileName;
    const fileName = fileNameBase.toLowerCase().endsWith('.pdf')
      ? fileNameBase
      : `${fileNameBase}.pdf`;
    const pdfMetadata: PdfMetadata = {
      publicId,
      secureUrl: secureUrl.replace(/\s+/g, ''),
      fileName,
      format: format || 'pdf',
      bytes: typeof info.bytes === 'number' ? info.bytes : 0,
      resourceType: 'image',
    };

    onPdfsAdd([pdfMetadata]);
    resetBodyOverflow();
  };

  return (
    <section className="flex w-full flex-col items-center gap-2 ">
      <CldUploadWidget
        uploadPreset={CLOUDINARY_PDF_UPLOAD_PRESET}
        options={widgetOptions}
        onSuccess={handleUpload}
        onError={() => {
          handleToast({
            type: 'error',
            title: 'Error al subir PDF',
            text: 'No se pudo subir el archivo. Inténtalo nuevamente.',
          });
          resetBodyOverflow();
        }}
        onClose={resetBodyOverflow}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open?.()}
            className="flex items-center gap-2 rounded bg-caramel-deep px-4 py-2 text-white hover:bg-amber-sunset"
          >
            <UploadIcon size={20} title="Subir PDF" color="white" />
            Subir PDF
          </button>
        )}
      </CldUploadWidget>
      <p className="text-xs text-gray-500">Podés seleccionar uno o varios archivos PDF.</p>
    </section>
  );
}
