import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localizedMetadata } from "@/i18n/metadata";
import "../../booths/booths.css";
import "../../booths/booths-keyvisual.css";
export async function generateMetadata(): Promise<Metadata> { return localizedMetadata(await getLocale(), "/booths"); }
export default async function BoothsLayout({ children }: { children: React.ReactNode }) {
 const en = (await getLocale()) === "en";
 return <div className="booths-app">{children}<footer className="booths-footer"><span>GLOBAL CITIZENS DAY 2026</span><span>{en ? "Connecting brands · Sharing Vietnamese values" : "Kết nối thương hiệu · Lan toả giá trị Việt"}</span><Link href="/">{en ? "Back to the event ↗" : "Về trang sự kiện ↗"}</Link></footer></div>;
}
