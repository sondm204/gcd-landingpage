import type { Metadata } from "next";
import { Suspense } from "react";
import RhythmGame from "@/app/game/rhythm/rhythm-game";
import "@/app/game/rhythm/rhythm.css";
export const metadata: Metadata = { title: "Bắt nhịp di sản — Hộ chiếu Di sản", description: "Chạm và giữ nốt trên bốn làn trong 60 giây, bắt nhịp nhanh dần và khám phá dấu Đôi tai.", alternates: { canonical: "/game/rhythm" } };
export default function Page() { return <Suspense fallback={<main>Đang chuẩn bị sân khấu…</main>}><RhythmGame /></Suspense>; }
