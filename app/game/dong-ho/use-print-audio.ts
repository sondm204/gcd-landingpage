"use client";

import { useEffect, useRef, useState } from "react";

/** Short synthesized cues; no downloads or background music. Starts only in a user gesture. */
export function usePrintAudio() {
  const [enabled, setEnabled] = useState(true);
  const context = useRef<AudioContext | null>(null);
  useEffect(() => () => {
    const current = context.current;
    context.current = null;
    if (current && current.state !== "closed") void current.close().catch(() => {});
  }, []);

  function play(clear: boolean) {
    if (!enabled || document.hidden || typeof AudioContext === "undefined") return;
    try {
      const audio = context.current ?? (context.current = new AudioContext());
      const sound = () => {
        if (audio.state !== "running" || document.hidden) return;
        const notes = clear ? [523.25, 659.25, 783.99] : [190];
        notes.forEach((frequency, index) => {
          const at = audio.currentTime + index * .075;
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          oscillator.type = clear ? "sine" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, at);
          if (!clear) oscillator.frequency.exponentialRampToValueAtTime(80, at + .09);
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(clear ? .09 : .12, at + .006);
          gain.gain.exponentialRampToValueAtTime(.001, at + (clear ? .28 : .11));
          oscillator.connect(gain); gain.connect(audio.destination);
          oscillator.start(at); oscillator.stop(at + (clear ? .3 : .13));
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
      };
      if (audio.state === "suspended") void audio.resume().then(sound).catch(() => {});
      else sound();
    } catch { /* Audio support never blocks placement. */ }
  }
  return { enabled, setEnabled, play };
}
