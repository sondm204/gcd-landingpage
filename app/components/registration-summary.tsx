"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCopy, useLocalizedData } from "@/i18n/copy";
import { event as eventSource } from "@/lib/event";
import { Sun } from "./ornaments";

export default function RegistrationSummary() {
  const event = useLocalizedData(eventSource);
  const t = useCopy();
  return <aside className="registration-summary" aria-label={event.name}>
    <Image src="/keyvisual/1.png" alt="" fill sizes="(max-width: 900px) 100vw, 420px" className="registration-summary-art" />
    <div className="registration-summary-copy">
      <Sun />
      <p>Global Citizens Day 2026</p>
      <h2>The Heritage<br />Odyssey</h2>
      <p className="registration-summary-slogan">{event.slogan}</p>
      <dl><div><dt>{event.date}</dt><dd>{event.venue}<span>{event.address}</span></dd></div></dl>
      <Link href="/#lich-trinh">{t("Lịch trình sự kiện")}</Link>
    </div>
  </aside>;
}
