"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-[#5a6a7a]">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {total.toLocaleString()} games
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border border-[#2a3a55] px-3 py-1.5 text-xs text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-30 disabled:hover:border-[#2a3a55] disabled:hover:text-[#8899aa]"
        >
          Previous
        </button>
        <span className="text-xs text-[#5a6a7a]">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-[#2a3a55] px-3 py-1.5 text-xs text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-30 disabled:hover:border-[#2a3a55] disabled:hover:text-[#8899aa]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
