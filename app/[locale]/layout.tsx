import type { Metadata } from "next";
import SiteHeader from "../components/site-header";
import "../fonts.css";
import "../globals.css";
import "../keyvisual.css";
import "../program-logos.css";
import "../ui-system.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localizedMetadata } from "@/i18n/metadata";

export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localizedMetadata((await params).locale);
}
export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages();
  return <html lang={locale}><body><NextIntlClientProvider locale={locale} messages={messages}><SiteHeader />{children}</NextIntlClientProvider></body></html>;
}
