import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "@/app/booths/booths.css";
import "@/app/booths/booths-keyvisual.css";
import "@/app/registration-admin.css";

export async function generateMetadata(): Promise<Metadata> { return { title: (await getLocale()) === "en" ? "Attendee management | Global Citizens Day 2026" : "Quản trị người tham dự | Global Citizens Day 2026", robots: { index: false, follow: false }, referrer: "no-referrer" }; }
export default function RegistrationAdminLayout({ children }: { children: React.ReactNode }) { return <div className="booths-app">{children}</div>; }
