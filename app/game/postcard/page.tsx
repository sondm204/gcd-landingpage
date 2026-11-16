import type { Metadata } from "next";
import { Suspense } from "react";
import PostcardGame from "./postcard-game";
import "./postcard.css";
export const metadata: Metadata = { title: "Đại sứ di sản — Hộ chiếu Di sản", description: "Tạo postcard giới thiệu di sản Việt Nam bằng lời nhắn tiếng Anh của chính bạn.", alternates: { canonical: "/game/postcard" } };
export default function Page() { return <Suspense fallback={<main>Đang mở bàn viết postcard…</main>}><PostcardGame /></Suspense>; }
