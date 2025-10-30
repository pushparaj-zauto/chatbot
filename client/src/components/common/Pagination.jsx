import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages)
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1f2e]">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
          to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          results
        </span>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Items per page:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-white dark:bg-[#1a1f2e] border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n} className="cursor-pointer">
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border ${
            currentPage === 1
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1419]"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`px-3 py-1 rounded border ${
              currentPage === num
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1419]"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`p-2 rounded border ${
            currentPage === totalPages || totalPages === 0
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1419]"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
