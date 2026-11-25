import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import EventRegistration from "@/app/components/event-registration";
import RegistrationSummary from "@/app/components/registration-summary";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLocale()) === "en";
  const title = en ? "Event registration — Global Citizens Day 2026" : "Đăng ký tham gia — Global Citizens Day 2026";
  const description = en ? "Register to attend Global Citizens Day 2026 — Vietnam Roots, Global Minds." : "Đăng ký tham dự Global Citizens Day 2026 — Vietnam Roots, Global Minds.";
  const url = en ? "/en/register" : "/register";
  return { title, description, alternates: { canonical: url, languages: { vi: "/register", en: "/en/register", "x-default": "/register" } }, openGraph: { title, description, url, locale: en ? "en_US" : "vi_VN" }, twitter: { title, description } };
}

export default async function RegisterPage() {
  const en = (await getLocale()) === "en";
  return <main className="registration-page"><nav className="registration-page-nav"><Link href="/">{en ? "Back to the event" : "Về trang sự kiện"}</Link></nav><div className="registration-layout"><RegistrationSummary /><EventRegistration /></div></main>;
}
