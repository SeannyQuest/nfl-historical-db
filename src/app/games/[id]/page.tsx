"use client";

import { use } from "react";
import { useGame } from "@/hooks/use-games";
import GameDetail from "@/components/game-detail";

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGame(id);

  return (
    <GameDetail
      game={data?.data ?? null}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
