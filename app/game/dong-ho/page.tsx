import type { Metadata } from "next";
import { Suspense } from "react";
import PrintGame from "./print-game";
import "./print.css";
export const metadata: Metadata = { title: "Xếp ván Đông Hồ — Hộ chiếu Di sản", description: "Xếp khối trên ván 8×8 để in từng lớp màu và khám phá tranh dân gian.", alternates: { canonical: "/game/dong-ho" } };
export default function Page() { return <Suspense fallback={<main>Đang mở ván in…</main>}><PrintGame /></Suspense>; }
