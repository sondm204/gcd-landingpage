import { getLocale } from "next-intl/server";
export async function generateMetadata() { return { title: (await getLocale()) === "en" ? "Booth administration — GCD 2026" : "Quản trị gian hàng — GCD 2026", robots: { index: false, follow: false } }; }
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
