"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

export default function HomeLink(props: Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "scroll">) {
  const pathname = usePathname();
  return <Link {...props} href="/" scroll={false} onNavigate={(event) => {
    if (pathname !== "/") return;
    event.preventDefault();
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.dispatchEvent(new Event("restart-hero-intro"));
  }} />;
}
