import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Global Citizens Day 2026 — The Heritage Odyssey. Vietnam Roots – Global Minds. 29/11/2026, Học viện Thanh thiếu niên Việt Nam.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const poster = await readFile(join(process.cwd(), "public/keyvisual/3.png"));
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#08275c" }}>
      {/* Use the supplied event artwork; preserve the identity and all event details. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${poster.toString("base64")}`} alt="" width={1200} height={630} style={{ objectFit: "cover", objectPosition: "center" }} />
    </div>, size,
  );
}
