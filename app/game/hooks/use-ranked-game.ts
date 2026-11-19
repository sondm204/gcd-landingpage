"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ATTEMPT_LIMIT, type Attempt, type GameId } from "@/lib/games/types";
import { GameRequestError, gameRequest, useGameAccount } from "../components/game-account";

type Pending = { id: string; payload: unknown };
export function useRankedGame<S extends { phase: string }, A extends { type: string }>(game: GameId, mode: "online" | "event", reducer: (state: S, action: A) => S, initial: () => S) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initial);
  const account = useGameAccount();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const attempt = useRef<Attempt | null>(null), pending = useRef<Pending | null>(null);
  const log = useRef<Record<string, unknown>[]>([]), origin = useRef<number | undefined>(undefined), lastTick = useRef(-Infinity);
  const starting = useRef(false), saving = useRef(false), submitted = useRef(false), requestKey = useRef("");
  const storageKey = `gcd-game-pending:${account.player?.id}:${game}`;
  const refresh = account.refresh;
  const remaining = Math.max(0, ATTEMPT_LIMIT - (account.usage.find(u => u.game === game)?.used ?? 0));
  const save = useCallback(async (value: Pending) => {
    if (saving.current) return false;
    saving.current = true; setSaveStatus("saving"); setError(""); setCanRetry(false);
    try {
      const result = await gameRequest<{ score: number }>(`/api/game/attempts/${value.id}`, { method: "POST", body: JSON.stringify(value.payload) });
      setSavedScore(result.score); setSaveStatus("saved"); pending.current = null;
      try { localStorage.removeItem(storageKey); } catch { /* Retry storage is optional. */ }
      await refresh(); return true;
    } catch (e) {
      if (e instanceof GameRequestError && [400,404,409,413].includes(e.status)) { pending.current = null; try { localStorage.removeItem(storageKey); } catch { /* Clear in-memory retry too. */ } }
      if (e instanceof GameRequestError && e.status === 401) void refresh();
      setCanRetry(pending.current !== null);
      setSaveStatus("error"); setError(e instanceof Error ? e.message : "Chưa thể lưu điểm."); return false;
    }
    finally { saving.current = false; }
  }, [storageKey, refresh]);
  useEffect(() => {
    const timer = setTimeout(() => {
      try { const raw = localStorage.getItem(storageKey); if (raw) { const value = JSON.parse(raw) as Pending; if (typeof value.id === "string" && value.payload) { pending.current = value; void save(value); } } } catch { /* A draft from another version may be invalid. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, save]);
  const dispatch = useCallback((action: A) => {
    if (attempt.current && action.type !== "reset") {
      const recorded = { ...action } as Record<string, unknown>;
      if (typeof recorded.now === "number") { origin.current ??= recorded.now; recorded.now -= origin.current; }
      const skipTick = game === "rhythm" && recorded.type === "tick" && typeof recorded.elapsed === "number" && recorded.elapsed < 60000 && recorded.elapsed - lastTick.current < 16;
      if (!skipTick && log.current.length < 20000) { log.current.push(recorded); if (typeof recorded.elapsed === "number") lastTick.current = recorded.elapsed; }
    }
    rawDispatch(action);
  }, [game]);
  async function begin(factory?: (seed: number) => A) {
    if (starting.current || saving.current) return false;
    starting.current = true; setBusy(true); setError("");
    try {
      if (pending.current && !await save(pending.current)) return false;
      requestKey.current ||= crypto.randomUUID();
      const response = await gameRequest<{ attempt: Attempt }>("/api/game/attempts", { method: "POST", body: JSON.stringify({ game, mode, request_key: requestKey.current }) });
      attempt.current = response.attempt; requestKey.current = ""; log.current = []; origin.current = undefined; lastTick.current = -Infinity; submitted.current = false;
      setSaveStatus("idle"); setSavedScore(null);
      if (factory) dispatch(factory(response.attempt.seed));
      void refresh(); return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa thể bắt đầu lượt chơi."); void refresh(); return false; }
    finally { starting.current = false; setBusy(false); }
  }
  const complete = useCallback(async (payload: unknown) => {
    if (!attempt.current) return false;
    const value = { id: attempt.current.id, payload }; pending.current = value;
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* In-memory retry remains available. */ }
    return save(value);
  }, [storageKey, save]);
  useEffect(() => {
    if (state.phase === "result" && attempt.current && !submitted.current) { submitted.current = true; void complete(log.current.slice()); }
  }, [state.phase, complete]);
  return { state, dispatch, begin, complete, retry: () => pending.current ? save(pending.current) : Promise.resolve(false), canRetry, remaining, busy: busy || saveStatus === "saving", error, saveStatus, savedScore };
}
export type RankedRun = Pick<ReturnType<typeof useRankedGame>, "remaining" | "busy" | "error" | "saveStatus" | "savedScore" | "retry" | "canRetry">;
