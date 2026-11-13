import type { SVGProps } from "react";
import type { BOOTH_ZONES } from "@/lib/booths/types";

type ZoneIcon = "nature" | "culture" | "knowledge" | (typeof BOOTH_ZONES)[number]["icon"];

export default function BoothZoneIcon({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: ZoneIcon }) {
  return <svg viewBox="0 0 48 48" width={32} height={32} fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    {kind === "nature" && <>
      <path d="M23 24C11 25 5 17 6 7c11 0 19 6 17 17ZM26 19C23 8 31 3 42 3c0 11-6 19-16 16ZM26 34c-1-10 6-16 17-16-1 10-7 17-17 16ZM21 38C11 39 5 33 4 24c10-1 17 4 17 14Z" />
      <path d="M24 44V27c0-7 4-13 9-18M24 31l-9-14M24 39l10-12M24 42l-11-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </>}
    {kind === "knowledge" && <>
      <path d="M5 8c7-2 13-1 18 3v29c-5-4-11-5-18-3V8ZM43 8c-7-2-13-1-18 3v29c5-4 11-5 18-3V8Z" />
      <path d="M2 12v29c8-2 15-1 22 3 7-4 14-5 22-3V12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </>}
    {kind === "culture" && <>
      <path d="M22 4h4v5h-4zM24 8c-5 5-10 7-18 7l4 5h28l4-5c-8 0-13-2-18-7ZM9 23h30v4H9zM12 29h5v10h-5zM22 29h4v10h-4zM31 29h5v10h-5zM7 39h34v4H7zM3 44h42v3H3z" />
      <path d="M12 12 8 7M36 12l4-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </>}
  </svg>;
}
