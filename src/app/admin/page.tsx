"use client";

import { useApiUsage } from "@/hooks/use-games";
import SyncPanel from "@/components/sync-panel";

export default function AdminPage() {
  const { data, isLoading, isError } = useApiUsage();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Manage Sportsradar API sync, monitor usage, and control data
            imports.
          </p>
        </div>
        <SyncPanel
          initialUsage={data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
