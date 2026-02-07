"use client";

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
      <div className="h-3 w-20 rounded bg-[#1e2a45]" />
      <div className="mt-2 h-6 w-16 rounded bg-[#1e2a45]" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full rounded bg-[#1e2a45]" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#1e2a45]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1e2a45] bg-[#0d1321]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-20 rounded bg-[#1e2a45]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[#1e2a45] bg-[#141b2d] p-6">
      <div className="mb-4 h-4 w-32 rounded bg-[#1e2a45]" />
      <div className="h-48 w-full rounded bg-[#1e2a45]" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse h-8 w-48 rounded bg-[#1e2a45]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}
