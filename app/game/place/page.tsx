import type { Metadata } from "next";
import { Suspense } from "react";
import PlaceGame from "./place-game";
import "./place.css";

export const metadata: Metadata = { title: "Đây là đâu? — Hộ chiếu Di sản", description: "Nhìn ảnh di sản, ghim vị trí trên bản đồ Việt Nam và khám phá dấu Đôi chân.", alternates: { canonical: "/game/place" } };
export default function Page() { return <Suspense fallback={<main>Đang mở bản đồ di sản…</main>}><PlaceGame /></Suspense>; }
