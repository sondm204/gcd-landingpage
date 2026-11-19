import type { Metadata } from "next";
import PassportAdmin from "./passport-admin";
export const metadata: Metadata = { title: "Quản trị passport — GCD 2026", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <PassportAdmin />; }
