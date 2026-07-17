import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-border-low-contrast/50 bg-surface-container-lowest px-6 py-3.5 select-none shrink-0">
      <div className="text-body-sm text-on-surface-variant">
        Mostrando <span className="font-semibold text-on-surface">{startItem}</span> a{' '}
        <span className="font-semibold text-on-surface">{endItem}</span> de{' '}
        <span className="font-semibold text-on-surface">{totalItems}</span> registros
      </div>
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-low-contrast bg-surface text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-on-surface-variant transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Página Anterior"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Page numbers */}
        {getPages().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 text-on-surface-variant text-body-sm">
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg text-body-sm font-semibold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-primary text-white shadow-[0_2px_8px_rgba(88,43,232,0.25)]'
                  : 'border border-border-low-contrast bg-surface text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-low-contrast bg-surface text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-on-surface-variant transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Próxima Página"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
