"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
}

export default function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
      <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#f0f0f0]">{value}</p>
      {detail && (
        <p className="mt-0.5 text-xs text-[#8899aa]">{detail}</p>
      )}
    </div>
  );
}
