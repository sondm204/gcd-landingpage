"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="language-switch" role="group" aria-label={locale === "en" ? "Language" : "Ngôn ngữ"}>
    {(["vi", "en"] as const).map(next => <button key={next} type="button" lang={next} aria-label={next === "vi" ? "Tiếng Việt" : "English"} aria-pressed={locale === next} disabled={pending || locale === next} onClick={() => {
      if (!window.dispatchEvent(new Event("i18n-before-switch", { cancelable: true }))) return;
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
      // Preserve query and anchor; these may encode a booth or a home section.
      startTransition(() => router.replace(pathname + window.location.search + window.location.hash, { locale: next, scroll: false }));
    }}>{next.toUpperCase()}</button>)}
  </div>;
}
