import type { Metadata } from "next";
import CheckIn from "./check-in";
export const metadata: Metadata = { title: "Nhận dấu — Hộ chiếu Di sản", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <CheckIn />; }
