"use client";
import { useEffect, useRef, useState } from "react";
import { DURATION, LEAD_IN, beatInterval, beats, notes } from "./engine";

export function useRhythmAudio() {
  const context = useRef<AudioContext | null>(null);
  const origin = useRef(0);
  const [muted, setMuted] = useState(false);
  const master = useRef<GainNode | null>(null);
  function stop() {
    const audio = context.current; context.current = null; master.current = null;
    if (audio && audio.state !== "closed") void audio.close().catch(() => {});
  }
  async function start() {
    stop();
    const audio = new AudioContext(); context.current = audio;
    await audio.resume();
    if (context.current !== audio) return false;
    const gain = audio.createGain(); gain.gain.value = muted ? 0 : .5; gain.connect(audio.destination); master.current = gain;
    origin.current = audio.currentTime + LEAD_IN / 1000;
    const tone = (at: number, frequency: number, duration: number, volume: number, type: OscillatorType, attack = .005) => {
      duration = Math.min(duration, origin.current + DURATION / 1000 - at);
      if (duration <= attack) return;
      const o = audio.createOscillator(), envelope = audio.createGain(); o.type = type; o.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(volume, at + attack); envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
      o.connect(envelope); envelope.connect(gain); o.start(at); o.stop(at + duration + .02);
      o.onended = () => { o.disconnect(); envelope.disconnect(); };
    };
    // Original background arrangement: pentatonic plucks, warm chords, bass and percussion.
    // Every layer uses the same accelerating beatmap and clock as the falling notes.
    const chords = [[146.83, 220, 293.66], [164.81, 246.94, 329.63], [110, 164.81, 220], [130.81, 196, 261.63]];
    const melody = [587.33, 659.25, 880, 659.25, 587.33, 493.88, 440, 493.88];
    notes.forEach(n => {
      const at = origin.current + n.at / 1000;
      tone(at, [293.66, 329.63, 440, 493.88][n.lane], n.duration ? n.duration / 1000 : .24, .15, n.lane % 2 ? "triangle" : "sine");
    });
    // Keep the accompaniment continuous during the reserved space after a hold.
    beats.forEach((time, id) => {
      const at = origin.current + time / 1000;
      const beat = beatInterval(time) / 1000;
      const chord = chords[Math.floor(id / 8) % chords.length];
      tone(at, id % 4 === 0 ? 85 : 1250, .06, id % 4 === 0 ? .12 : .035, "sine");
      tone(at + beat / 2, melody[id % melody.length], beat * .8, .085, "triangle");
      if (id % 2 === 0) tone(at, chord[0] / 2, beat * 1.4, .13, "sine");
      if (id % 8 === 0) chord.forEach(f => tone(at, f, beat * 7, .055, "sine", .12));
    });
    for (let beat = -3; beat < 0; beat++) {
      tone(Math.max(audio.currentTime, origin.current + beat), beat === -1 ? 880 : 440, .12, .1, "sine");
    }
    return true;
  }
  const elapsed = () => context.current ? (context.current.currentTime - origin.current) * 1000 : -LEAD_IN;
  async function pause() { if (context.current?.state === "running") await context.current.suspend(); }
  async function resume() { if (context.current) await context.current.resume(); }
  function toggle() {
    const next = !muted; setMuted(next);
    if (master.current && context.current) master.current.gain.setTargetAtTime(next ? 0 : .5, context.current.currentTime, .02);
  }
  useEffect(() => () => { const a = context.current; context.current = null; if (a && a.state !== "closed") void a.close().catch(() => {}); }, []);
  return { start, stop, pause, resume, elapsed, muted, toggle };
}
