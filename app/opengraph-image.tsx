import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Global Citizens Day 2026 — Vietnam Roots, Global Mind";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const panorama = await readFile(join(process.cwd(), "public/images/heritage-panorama.png"));
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f3eddf", position: "relative", color: "#293e34" }}>
      {/* The data URL keeps rendering independent of the site's public host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${panorama.toString("base64")}`} alt="" width="1200" height="630" style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(243,237,223,.98) 0%, rgba(243,237,223,.92) 50%, rgba(243,237,223,.05) 90%)" }} />
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, flexDirection: "column", width: "100%", height: "100%", padding: "42px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 17, letterSpacing: 3 }}><span style={{ display: "flex", background: "#aa382a", color: "#f3eddf", padding: "12px 15px", fontWeight: 700 }}>GCD / 26</span><span>VIETNAM ROOTS, GLOBAL MIND</span></div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30, fontSize: 76, lineHeight: 1.04, fontWeight: 700, letterSpacing: -3 }}><span>GLOBAL CITIZENS</span><span style={{ color: "#aa382a" }}>DAY 2026</span></div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 23, flexShrink: 0 }}>Từ cội nguồn Việt, mở tư duy toàn cầu.</div>
      </div>
    </div>,
    size,
  );
}
