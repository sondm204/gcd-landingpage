import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { event } from "@/lib/event";

export const alt = `Global Citizens Day 2026 — The Heritage Odyssey. Vietnam Roots – Global Minds. ${event.date}, ${event.venue}, ${event.address}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const poster = await readFile(join(process.cwd(), "public/keyvisual/3.png"));
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#08275c" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${poster.toString("base64")}`} alt="" width={1200} height={630} />
      <div style={{ position: "absolute", left: 175, top: 360, width: 600, height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, background: "#fff9ee", color: "#08275c", fontSize: 18 }}>
        <span>{event.date}</span>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 17 }}><strong>{event.venue}</strong><span>{event.address}</span></div>
      </div>
    </div>, size,
  );
}
