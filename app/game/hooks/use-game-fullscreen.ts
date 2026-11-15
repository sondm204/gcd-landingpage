"use client";
import { useEffect, useRef, useState } from "react";

export function useGameFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);
  const enteredHere = useRef(false);
  useEffect(() => {
    const update = () => { setFullscreen(Boolean(document.fullscreenElement)); setSupported(Boolean(document.fullscreenEnabled)); };
    update(); document.addEventListener("fullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      if (enteredHere.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);
  function enter() {
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      enteredHere.current = true;
      void document.documentElement.requestFullscreen().catch(() => { enteredHere.current = false; });
    }
  }
  function toggle() { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else enter(); }
  return { fullscreen, supported, enter, toggle };
}
