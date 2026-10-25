"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import "./sketchfab-viewer.css";

export type SketchfabModel = { id: string; title: string; url: string; author?: string; authorUrl?: string };
type Point = [number, number, number];
type Camera = { position: Point; target: Point };
type ViewerAPI = {
  start: () => void;
  stop: () => void;
  addEventListener: (event: "viewerready", callback: () => void) => void;
  getCameraLookAt: (callback: (error: unknown, camera: Camera) => void) => void;
  setCameraLookAt: (position: Point, target: Point, duration: number) => void;
  recenterCamera: (callback: (error: unknown) => void) => void;
};
type SketchfabConstructor = new (frame: HTMLIFrameElement) => {
  init: (id: string, options: Record<string, unknown> & {
    success: (api: ViewerAPI) => void;
    error: () => void;
  }) => void;
};

export default function SketchfabViewer({ model, reducedMotion, visible }: { model: SketchfabModel; reducedMotion: boolean; visible: boolean }) {
  const embedUrl = `https://sketchfab.com/models/${model.id}/embed?autostart=1&autospin=0&camera=0&animation_autoplay=0&transparent=1&navigation=orbit&scrollwheel=1&ui_theme=dark&dnt=1`;
  const [sdkReady, setSdkReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ViewerAPI | null>(null);
  const initialCamera = useRef<Camera | null>(null);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setFailed(true), 30_000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!sdkReady || !frameRef.current) return;
    const SDK = (window as Window & { Sketchfab?: SketchfabConstructor }).Sketchfab;
    if (!SDK) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => { if (!cancelled) setFailed(true); }, 30_000);
    new SDK(frameRef.current).init(model.id, {
      autostart: 1,
      autospin: 0,
      camera: 0,
      animation_autoplay: 0,
      transparent: 1,
      navigation: "orbit",
      scrollwheel: 1,
      ui_theme: "dark",
      ui_controls: 1,
      ui_fullscreen: 1,
      dnt: 1,
      success: (api) => {
        if (cancelled) { api.stop(); return; }
        apiRef.current = api;
        api.addEventListener("viewerready", () => {
          if (cancelled) return;
          window.clearTimeout(timeout);
          setFailed(false);
          api.start();
          // Frame the complete model for this viewport before saving the reset view.
          api.recenterCamera(() => {
            if (cancelled) return;
            api.getCameraLookAt((error, camera) => {
              if (cancelled || error) return;
              const position = camera.position.map((value, i) => camera.target[i] + (value - camera.target[i]) * 0.82) as Point;
              initialCamera.current = { position, target: [...camera.target] };
              api.setCameraLookAt(position, camera.target, 0);
              setReady(true);
            });
          });
        });
        api.start();
      },
      error: () => {
        if (!cancelled) { window.clearTimeout(timeout); setFailed(true); }
      },
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      apiRef.current?.stop();
      apiRef.current = null;
    };
  }, [sdkReady, model.id]);

  useEffect(() => {
    // stop() restores the Play screen; keep the loaded viewer running on scroll.
    if (ready && visible) apiRef.current?.start();
  }, [ready, visible]);

  function moveCamera(factor: number, angle = 0) {
    const api = apiRef.current;
    const initial = initialCamera.current;
    if (!ready || !api || !initial) return;
    api.getCameraLookAt((error, camera) => {
      if (error || apiRef.current !== api) return;
      const offset = camera.position.map((value, i) => value - camera.target[i]) as Point;
      const baseDistance = Math.hypot(...initial.position.map((value, i) => value - initial.target[i]));
      const currentDistance = Math.hypot(...offset);
      if (!currentDistance || !baseDistance) return;
      const distance = Math.min(baseDistance * 2.5, Math.max(baseDistance * 0.35, currentDistance * factor));
      // Sketchfab's orbit camera uses Z as the vertical axis.
      const [x, y, z] = offset;
      const rotated = [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle), z];
      const position = rotated.map((value, i) => camera.target[i] + value * distance / currentDistance) as Point;
      api.setCameraLookAt(position, camera.target, reducedMotion ? 0 : 0.25);
    });
  }

  function resetCamera() {
    const camera = initialCamera.current;
    if (camera) apiRef.current?.setCameraLookAt(camera.position, camera.target, reducedMotion ? 0 : 0.35);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { /* Sketchfab also provides its own fullscreen control. */ }
  }

  return <div className="sketchfab-viewer" ref={rootRef}>
    <Script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setFailed(true)} />
    <div className="sketchfab-stage">
      <iframe ref={frameRef} src={embedUrl} width="100%" height="100%" title={model.title} allow="autoplay; fullscreen; xr-spatial-tracking; web-share" allowFullScreen onLoad={() => apiRef.current?.start()} />
    </div>
    <div className="sketchfab-toolbar" role="group" aria-label={`Điều khiển mô hình ${model.title}`}>
      <span>Kéo để xoay · Cuộn hoặc chụm để zoom</span>
      <div className="sketchfab-buttons">
        <button type="button" disabled={!ready} aria-label="Phóng to mô hình" onClick={() => moveCamera(0.8)}>+</button>
        <button type="button" disabled={!ready} aria-label="Thu nhỏ mô hình" onClick={() => moveCamera(1.25)}>−</button>
        <button type="button" disabled={!ready} aria-label="Xoay trái" onClick={() => moveCamera(1, Math.PI / 6)}>↶</button>
        <button type="button" disabled={!ready} aria-label="Đặt lại góc nhìn" onClick={resetCamera}>⟲</button>
        <button type="button" disabled={!ready} aria-label="Xoay phải" onClick={() => moveCamera(1, -Math.PI / 6)}>↷</button>
        <button type="button" aria-label="Toàn màn hình mô hình" onClick={toggleFullscreen}>⛶</button>
      </div>
    </div>
    {failed && <p className="sketchfab-status" role="status">Mô hình chưa tải được. Bạn có thể <a href={model.url} target="_blank" rel="noopener noreferrer">mở trực tiếp trên Sketchfab ↗</a>.</p>}
  </div>;
}
