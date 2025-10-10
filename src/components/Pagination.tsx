'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

/**
 * Pagination component for navigating through pages of results.
 *
 * Displays prev/next buttons and page numbers with ellipsis for large page counts.
 * Updates URL searchParams to maintain filters when changing pages.
 *
 * @param currentPage - Current active page (1-indexed)
 * @param totalPages - Total number of pages available
 * @param total - Total number of items across all pages
 * @param limit - Number of items per page
 */
export default function Pagination({ currentPage, totalPages, total, limit }: PaginationProps) {
  const searchParams = useSearchParams();

  /**
   * Build URL for a specific page while preserving all other search parameters
   */
  const getPageUrl = (page: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', page.toString());
    return `?${params.toString()}`;
  };

  /**
   * Calculate which page numbers to display
   * Shows: [1] ... [current-1] [current] [current+1] ... [totalPages]
   */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1; // How many pages to show around current page

    // Always show first page
    pages.push(1);

    // Add ellipsis if there's a gap
    if (currentPage - delta > 2) {
      pages.push('ellipsis');
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    // Add ellipsis if there's a gap
    if (currentPage + delta < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Don't render if only 1 page
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Results summary */}
      <p className="text-sm text-gray-600">
        Mostrando {startItem}-{endItem} de {total} resultados
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Link
          href={getPageUrl(currentPage - 1)}
          onClick={(e) => {
            if (currentPage === 1) e.preventDefault();
          }}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg active:scale-95 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
          }`}
          aria-label="Página anterior"
          aria-disabled={currentPage === 1}
        >
          <ChevronLeftIcon size={16} />
        </Link>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Link
                key={page}
                href={getPageUrl(page)}
                onClick={(e) => {
                  if (isActive) e.preventDefault();
                }}
                className={`min-w-[40px] h-10 px-3 rounded-lg active:scale-95 text-sm font-medium transition-colors flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white pointer-events-none'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`Ir a página ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next button */}
        <Link
          href={getPageUrl(currentPage + 1)}
          onClick={(e) => {
            if (currentPage === totalPages) e.preventDefault();
          }}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg active:scale-95 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
          }`}
          aria-label="Página siguiente"
          aria-disabled={currentPage === totalPages}
        >
          <ChevronRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
}
