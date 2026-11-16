"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type { ComponentProps } from "react";

export default function HomeLink(props: Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "scroll">) {
  const pathname = usePathname();
  const locale = useLocale();
  return <Link {...props} href="/" scroll={false} onNavigate={(event) => {
    if (pathname !== "/") return;
    event.preventDefault();
    window.history.pushState(null, "", locale === "en" ? "/en" : "/");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("restart-hero-intro"));
  }} />;
}
