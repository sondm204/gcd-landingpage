"use client";

import { useEffect, useRef, useState } from "react";

export function useBackgroundMusic(active: boolean, source: string) {
  const [enabled, setEnabled] = useState(true);
  const track = useRef<HTMLAudioElement | null>(null);
  function start() {
    if (!enabled || document.hidden) return;
    if (!track.current) {
      track.current = new Audio(source);
      track.current.loop = true;
      track.current.volume = .25;
    }
    void track.current.play().catch(() => { /* Device policy may require another user gesture. */ });
  }
  function toggle() {
    if (enabled) track.current?.pause();
    else if (active) {
      if (!track.current) {
        track.current = new Audio(source);
        track.current.loop = true; track.current.volume = .25;
      }
      void track.current.play().catch(() => {});
    }
    setEnabled(!enabled);
  }
  useEffect(() => {
    const update = () => {
      if (!active || !enabled || document.hidden) track.current?.pause();
      else if (track.current) void track.current.play().catch(() => {});
      if (!active && track.current) track.current.currentTime = 0;
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [active, enabled]);
  useEffect(() => () => {
    if (track.current) { track.current.pause(); track.current.removeAttribute("src"); track.current.load(); track.current = null; }
  }, []);
  function stop() { if (track.current) { track.current.pause(); track.current.currentTime = 0; } }
  return { enabled, toggle, start, stop };
}
