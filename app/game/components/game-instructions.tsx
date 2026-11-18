"use client";

import { useRef, type ReactNode } from "react";

export default function GameInstructions({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="game-help-trigger" onClick={() => dialog.current?.showModal()}>Cách chơi chi tiết ↗</button>
    <dialog ref={dialog} className="game-help-dialog" aria-label="Hướng dẫn trò chơi" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="game-help-heading"><h2>Hướng dẫn trò chơi</h2><button type="button" aria-label="Đóng hướng dẫn" onClick={() => dialog.current?.close()}>✕</button></div>
      {children}
      <button type="button" className="game-help-done" onClick={() => dialog.current?.close()}>Đã hiểu, bắt đầu thôi</button>
    </dialog>
  </>;
}
