export type ProposalStatus = "pending" | "approved" | "rejected";
export type BoothPosition = {
  id: number;
  code: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pending_count: number;
  confirmed_brand: string | null;
  confirmed_booth: string | null;
  is_booked: boolean;
};
export type BoothProposal = {
  id: string; reference: string; position_id: number; brand: string; booth_name: string;
  contact_name: string; phone: string; email: string; website: string | null;
  category: string; description: string; image_paths: string[]; status: ProposalStatus;
  created_at: string; updated_at: string; reviewed_at: string | null; review_note: string | null;
  image_urls?: string[];
};

// Coordinates are percentages of a 1000 × 760 concept plan.
export function conceptPositions(): BoothPosition[] {
  return Array.from({ length: 40 }, (_, i) => {
    const id = i + 1;
    let x: number, y: number, zone: string;
    if (id <= 10) { x = 27 + i * 5.8; y = 14; zone = "Bắc"; }
    else if (id <= 20) { x = 88; y = 23 + (id - 11) * 5.7; zone = "Đông"; }
    else if (id <= 30) { x = 79.2 - (id - 21) * 5.8; y = 83; zone = "Nam"; }
    else { x = 20; y = 74.3 - (id - 31) * 5.7; zone = "Tây"; }
    return { id, code: `B${String(id).padStart(2, "0")}`, zone, x, y, width: 4.6, height: 4.5, pending_count: 0, confirmed_brand: null, confirmed_booth: null, is_booked: false };
  });
}
