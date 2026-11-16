"use client";
import { useEffect, useRef, useState } from "react";

export default function PostcardRecorder() {
  const [phase, setPhase] = useState("idle"), [error, setError] = useState(""), [seconds, setSeconds] = useState(15), [clip, setClip] = useState<{ url: string; type: string } | null>(null);
  const camera = useRef<HTMLVideoElement>(null), recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), timer = useRef<ReturnType<typeof setInterval> | null>(null), mounted = useRef(false), url = useRef<string | null>(null), requesting = useRef(false);
  function stop() { if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach(t => t.stop()); if (timer.current) clearInterval(timer.current); }
  useEffect(() => {
    mounted.current = true;
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { mounted.current = false; stop(); if (url.current) URL.revokeObjectURL(url.current); document.removeEventListener("visibilitychange", hide); };
  }, []);
  async function start() {
    if (requesting.current || recorder.current?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Trình duyệt này chưa hỗ trợ quay clip. Bạn vẫn có thể tải postcard."); return; }
    requesting.current = true; setPhase("requesting"); setError(""); setSeconds(15);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      if (!mounted.current || document.hidden) { media.getTracks().forEach(t => t.stop()); if (mounted.current) { setPhase("idle"); setError("Hãy quay lại tab này rồi bấm quay để bắt đầu."); } return; }
      stream.current = media; if (camera.current) camera.current.srcObject = media;
      const type = ["video/webm;codecs=vp8,opus", "video/mp4", "video/webm"].find(t => MediaRecorder.isTypeSupported(t));
      const recording = new MediaRecorder(media, type ? { mimeType: type } : undefined); recorder.current = recording;
      const chunks: Blob[] = [];
      recording.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recording.onstop = () => {
        media.getTracks().forEach(t => t.stop()); if (timer.current) clearInterval(timer.current);
        if (!mounted.current) return;
        const blob = new Blob(chunks, { type: recording.mimeType || type || "video/webm" });
        if (!blob.size) { setError("Clip chưa được ghi lại. Bạn có thể quay lại."); setPhase("idle"); return; }
        if (url.current) URL.revokeObjectURL(url.current); url.current = URL.createObjectURL(blob);
        setClip({ url: url.current, type: blob.type }); setPhase("ready");
      };
      recording.onerror = () => { stop(); if (mounted.current) setError("Quay clip bị gián đoạn. Bạn có thể quay lại."); };
      recording.start(250); setPhase("recording");
      const started = performance.now();
      timer.current = setInterval(() => { const left = Math.max(0, Math.ceil((15000 - performance.now() + started) / 1000)); if (mounted.current) setSeconds(left); if (!left) stop(); }, 100);
    } catch { stream.current?.getTracks().forEach(t => t.stop()); if (mounted.current) { setPhase("idle"); setError("Chưa mở được camera/micro. Hãy kiểm tra quyền truy cập rồi thử lại; postcard vẫn tải được bình thường."); } }
    finally { requesting.current = false; }
  }
  return <section className="post-record"><h3>Đọc lời nhắn của bạn <span>Tuỳ chọn · 15 giây</span></h3><p>Gửi thêm giọng nói của bạn cùng lời giới thiệu di sản.</p>
    {phase === "ready" && clip ? <video src={clip.url} controls playsInline /> : <video ref={camera} autoPlay muted playsInline hidden={phase === "idle"} />}
    {phase === "recording" ? <button onClick={stop}>Dừng quay · <span role="timer">{seconds}s</span></button> : <button disabled={phase === "requesting"} onClick={() => void start()}>{phase === "requesting" ? "Đang mở camera…" : clip ? "Quay lại clip" : "Quay clip 15 giây"}</button>}
    {phase === "ready" && clip && <a href={clip.url} download={`heritage-voice.${clip.type.includes("mp4") ? "mp4" : "webm"}`}>Tải clip ↓</a>}
    {error && <p role="alert">{error}</p>}<small>Camera chỉ bật khi bạn chọn quay. Clip ở trên thiết bị và không được tải lên máy chủ.</small>
  </section>;
}
