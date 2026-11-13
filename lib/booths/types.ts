export type ProposalStatus = "pending" | "approved" | "rejected";
export const BOOTH_COUNT = 25;
export const POSITION_COUNT = 33;
export const BOOTH_ZONES = [
  {
    "name": "Gian thương mại",
    "icon": "culture",
    "firstId": 1,
    "lastId": 20,
    "prefix": "TM",
    "color": "#3452a1",
    "background": "#edf1ff",
    "theme": "Giới thiệu sản phẩm & thương hiệu",
    "description": "Dành cho cửa hàng, thương hiệu và đơn vị giới thiệu sản phẩm, dịch vụ tại sự kiện.",
    "examples": [
      "Sản phẩm và quà tặng",
      "Ẩm thực và dịch vụ",
      "Trải nghiệm thương hiệu"
    ],
    "prompt": "Bạn sẽ mang sản phẩm và trải nghiệm gì đến sự kiện?",
    "bookable": true
  },
  {
    "name": "Gian tài trợ",
    "icon": "knowledge",
    "firstId": 21,
    "lastId": 25,
    "prefix": "TT",
    "color": "#9a650e",
    "background": "#fff4e5",
    "theme": "Không gian dành cho nhà tài trợ",
    "description": "Dành cho đơn vị đề xuất đồng hành và tài trợ; hình thức tham gia được ban tổ chức trao đổi trước khi xác nhận.",
    "examples": [
      "Giới thiệu nhà tài trợ",
      "Trải nghiệm thương hiệu",
      "Hoạt động đồng hành"
    ],
    "prompt": "Bạn đề xuất hình thức đồng hành và hoạt động nào?",
    "bookable": true
  },
  {
    "name": "Gian văn hoá",
    "icon": "culture",
    "firstId": 26,
    "lastId": 30,
    "prefix": "VH",
    "color": "#087d73",
    "background": "#e9f6f1",
    "theme": "Trải nghiệm văn hoá",
    "description": "Đã có đơn vị phụ trách, không nhận đăng ký mới.",
    "examples": [
      "Trải nghiệm văn hoá",
      "Hoạt động truyền thống"
    ],
    "prompt": "",
    "bookable": false
  },
  {
    "name": "Gian BTC",
    "icon": "knowledge",
    "firstId": 31,
    "lastId": 33,
    "prefix": "BTC",
    "color": "#793c91",
    "background": "#f5ecfa",
    "theme": "Hỗ trợ khách & đổi quà",
    "description": "Ban tổ chức vận hành; không nhận đăng ký.",
    "examples": [
      "BTC01–BTC02: hỗ trợ khách",
      "BTC03: đổi quà"
    ],
    "prompt": "",
    "bookable": false
  }
] as const;

export function zoneForPosition(id: number) {
  return BOOTH_ZONES.find((zone) => id >= zone.firstId && id <= zone.lastId);
}

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
  is_bookable: boolean;
};
export type BoothProposal = {
  id: string; reference: string; position_id: number; brand: string; booth_name: string;
  contact_name: string; phone: string; email: string; website: string | null;
  category: string; description: string; image_paths: string[]; status: ProposalStatus;
  created_at: string; updated_at: string; reviewed_at: string | null; review_note: string | null;
  image_urls?: string[];
  payment?: { base: number; discount: number; amount: number; discount_code: string; memo: string; receipt_path: string | null } | null;
  receipt_url?: string;
};

// Coordinates are percentages of the supplied square plan.
export function conceptPositions(): BoothPosition[] {
  return Array.from({ length: POSITION_COUNT }, (_, i) => {
    const id = i + 1, group = zoneForPosition(id)!;
    const n = id - group.firstId + 1;
    let x: number, y: number, w = 78, h = 52;
    if (id <= 20) {
      if (n <= 4) { x = 454; y = 707 + (n - 1) * 71; }
      else if (n <= 11) { x = 454 + (n - 5) * 93; y = 1028; }
      else if (n <= 17) { x = 788 + (n - 12) * 93; y = 781; }
      else { x = 1123; y = 1028 + (n - 18) * 65; }
    } else if (id <= 25) { x = n <= 3 ? 788 + (n - 1) * 93 : 788; y = n <= 3 ? 523 : 595 + (n - 4) * 72; h = 58; }
    else if (id <= 30) { x = n <= 4 ? 117 + (n - 1) * 93 : 396; y = n <= 4 ? 467 : 541; h = 58; }
    else { x = n === 1 ? 1272 : 117; y = n === 1 ? 691 : n === 2 ? 707 : 1028; w = n === 1 ? 226 : 265; h = 82; }
    return { id, code: group.prefix + String(n).padStart(2, '0'), zone: group.name, x: x/16, y: y/16, width: w/16, height: h/16, pending_count: 0, confirmed_brand: null, confirmed_booth: null, is_booked: false, is_bookable: group.bookable };
  });
}
