import type { Metadata } from "next";
import SiteHeader from "../components/site-header";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "../globals.css";
import "../keyvisual.css";
import "../program-logos.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localizedMetadata } from "@/i18n/metadata";

const vietnam = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return localizedMetadata((await params).locale);
}
export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages();
  return <html lang={locale} className={`${vietnam.variable} ${playfair.variable}`}><body><NextIntlClientProvider locale={locale} messages={messages}><SiteHeader />{children}</NextIntlClientProvider></body></html>;
}
