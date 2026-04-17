import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    startPage = 0;
    endPage = totalPages - 1;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 0;
      endPage = maxPagesToShow - 1;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxPagesToShow;
      endPage = totalPages - 1;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &laquo;
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &lsaquo;
      </button>
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-1 rounded-md border ${currentPage === number ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-accent'}`}
        >
          {number + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &rsaquo;
      </button>
      <button
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &raquo;
      </button>
    </nav>
  );
};

export default Pagination;