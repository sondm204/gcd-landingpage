export type PassportSettings = { collecting_open: boolean; redeeming_open: boolean; minimum_stamps: number | null; reward_label: string };
export type PassportStation = { id: number; code: string; name: string; zone: string; active: boolean; received_at: string | null };
export type Redemption = { redeemed_at: string; stamp_count: number; reward_label: string };
export type Passport = { card_code: string; settings: PassportSettings; count: number; redemption: Redemption | null; stations: PassportStation[] };
export type AdminStation = { id: number; code: string; name: string; zone: string; enabled: boolean; active: boolean; title: string | null; qr_token: string; visits: number };
export type PassportAdmin = { settings: PassportSettings; stations: AdminStation[]; total_stamps: number; total_players: number; total_redemptions: number; qr_origin: string };
export type PassportLookup = { player: { id: string; display_name: string }; passport: Passport };
export function extractPassportCode(value: string, kind: "station" | "card") {
  const text = value.trim();
  if (/^[a-f0-9]{64}$/.test(text)) return text;
  try { const url = new URL(text); if (!["http:","https:"].includes(url.protocol) || url.pathname !== (kind === "station" ? "/game/check-in" : "/game/admin")) return null; const code = new URLSearchParams(url.hash.slice(1)).get(kind === "station" ? "code" : "card"); return code && /^[a-f0-9]{64}$/.test(code) ? code : null; } catch { return null; }
}
