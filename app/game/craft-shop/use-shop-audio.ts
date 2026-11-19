"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Notice } from "./engine";

type Cue = "pick" | "remove" | "correct" | "wrong" | "expired";
/** Bright bell / wooden percussion cues, distinct from the printing game's pluck/chime. */
export function useShopAudio(notice: Notice | null) {
  const [enabled, setEnabled] = useState(true);
  const context = useRef<AudioContext | null>(null);
  const lastNotice = useRef(0);
  const unlock = useCallback(() => {
    if (typeof AudioContext === "undefined") return;
    try {
      const audio = context.current ?? (context.current = new AudioContext());
      if (audio.state === "suspended") void audio.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }, []);
  const play = useCallback((cue: Cue) => {
    if (!enabled || document.hidden) return;
    unlock();
    const audio = context.current;
    if (!audio) return;
    const sound = () => {
      if (audio.state !== "running" || document.hidden) return;
      const frequencies = { pick: [880], remove: [440], correct: [784, 1046.5, 1568], wrong: [220, 196], expired: [330, 247, 165] }[cue];
      frequencies.forEach((frequency, index) => {
        const at = audio.currentTime + index * .085;
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = cue === "correct" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * .75, at + .15);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(cue === "pick" ? .065 : .09, at + .004);
        gain.gain.exponentialRampToValueAtTime(.001, at + .18);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(at); oscillator.stop(at + .2);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    };
    if (audio.state === "suspended") void audio.resume().then(sound).catch(() => {});
    else sound();
  }, [enabled, unlock]);
  useEffect(() => {
    if (!notice) { lastNotice.current = 0; return; }
    if (notice.id === lastNotice.current) return;
    lastNotice.current = notice.id;
    play(notice.kind);
  }, [notice, play]);
  useEffect(() => () => {
    const audio = context.current; context.current = null;
    if (audio && audio.state !== "closed") void audio.close().catch(() => {});
  }, []);
  return { enabled, setEnabled, play, unlock };
}
