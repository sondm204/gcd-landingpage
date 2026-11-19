"use client";
import { useEffect, useRef, useState } from "react";
import "../game-screen.css";

export function useGameFullscreen(active = false) {
  const [fullscreen, setFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);
  const enteredHere = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--game-viewport-height");
    const update = () => root.style.setProperty("--game-viewport-height", `${Math.floor(window.visualViewport?.height || window.innerHeight)}px`);
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    document.addEventListener("fullscreenchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      document.removeEventListener("fullscreenchange", update);
      if (previous) root.style.setProperty("--game-viewport-height", previous);
      else root.style.removeProperty("--game-viewport-height");
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => { document.body.style.overflow = previous; };
  }, [active]);
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
