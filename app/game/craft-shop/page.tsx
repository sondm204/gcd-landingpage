import type { Metadata } from "next";
import { Suspense } from "react";
import CraftShop from "./shop";
import "./shop.css";

export const metadata: Metadata = { title: "Tiệm Bách nghệ — Hộ chiếu Di sản", description: "Ghé tiệm thủ công, nhận đơn hàng và khám phá làng nghề Hà Nội.", alternates: { canonical: "/game/craft-shop" } };
export default function Page() { return <Suspense fallback={<main className="craft-app">Đang mở cửa tiệm…</main>}><CraftShop /></Suspense>; }
