import type { Metadata } from "next";
import Leaderboard from "./leaderboard";
export const metadata: Metadata = { title: "Bảng xếp hạng — Hộ chiếu Di sản", alternates: { canonical: "/game/leaderboard" } };
export default function Page() { return <Leaderboard />; }
