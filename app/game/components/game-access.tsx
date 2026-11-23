import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { serviceClient } from "@/lib/booths/server";
import type { GameId } from "@/lib/games/types";

async function Access({ game, children }: { game: GameId; children: React.ReactNode }) {
  await connection();
  let open = false;
  try {
    const { data, error } = await serviceClient().from("game_availability").select("is_open").eq("game", game).single();
    open = !error && data?.is_open === true;
  } catch { /* Keep unavailable games closed. */ }
  if (!open) redirect((await getLocale()) === "en" ? "/en/game" : "/game");
  return children;
}
export default function GameAccess(props: { game: GameId; children: React.ReactNode }) {
  return <Suspense fallback={null}><Access {...props} /></Suspense>;
}
