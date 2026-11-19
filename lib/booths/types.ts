export type ProposalStatus = "pending" | "approved" | "rejected";
export const BOOTH_COUNT = 32;
export const POSITION_COUNT = 40;
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
  if (id >= 34 && id <= 37) return BOOTH_ZONES[0];
  if (id >= 38 && id <= 40) return BOOTH_ZONES[1];
  return BOOTH_ZONES.find((zone) => id >= zone.firstId && id <= zone.lastId);
}
export const isCommercialPosition = (id: number) => Number.isInteger(id) && ((id >= 1 && id <= 20) || (id >= 34 && id <= 37));
export const isBookablePosition = (id: number) => Number.isInteger(id) && ((id >= 1 && id <= 25) || (id >= 34 && id <= 40));
export const zonePositionCount = (prefix: string) => prefix === "TM" ? 24 : prefix === "TT" ? 8 : prefix === "VH" ? 5 : 3;
export function positionCode(id: number) {
  const zone = zoneForPosition(id);
  if (!zone) return "";
  const n = id >= 38 ? id - 32 : id >= 34 ? id - 13 : id - zone.firstId + 1;
  return zone.prefix + String(n).padStart(2, "0");
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
  confirmed_logo_url?: string | null;
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

// Keep database IDs stable: 34=TM21, 35–37=TM22–24, 38–40=TT06–08.
export function conceptPositions(): BoothPosition[] {
  return Array.from({ length: POSITION_COUNT }, (_, i) => {
    const id = i + 1, group = zoneForPosition(id)!;
    const code = positionCode(id), n = Number(code.replace(/\D/g, ""));
    let x: number, y: number, w = 78, h = 52;
    if (group.prefix === "TM") {
      w = 88; h = 46;
      if (n <= 4) { x = 465; y = 700 + (n - 1) * 58; }
      else if (n <= 11) { x = 465 + (n - 5) * 94; y = 985; }
      else if (n <= 16) { x = 1155; y = 985 + (n - 12) * 48; }
      else if (n === 17) { x = 780; y = 700; }
      else { x = 780 + (n - 18) * 94; y = 770; }
    } else if (group.prefix === "TT") {
      w = 88; h = 46;
      if (n === 6) { x = 790; y = 408; }
      else if (n <= 5) { x = n <= 3 ? 780 + (n - 1) * 94 : 780; y = n <= 3 ? 525 : 580 + (n - 4) * 55; }
      else { x = n === 7 ? 935 : 1070; y = n === 7 ? 408 : 512; w = n === 7 ? 280 : 150; h = n === 7 ? 66 : 70; }
    } else if (group.prefix === "VH") {
      if (n <= 3) { x = n === 1 ? 150 : n === 2 ? 300 : 100; y = n === 3 ? 540 : 465; w = 115; h = 64; }
      else { x = n === 4 ? 155 : 310; y = 608; w = 135; h = 68; }
    }
    else { x = n === 1 ? 1300 : 105; y = n === 1 ? 680 : n === 2 ? 695 : 985; w = n === 1 ? 240 : 285; h = 82; }
    return { id, code, zone: group.name, x: x/16, y: y/16, width: w/16, height: h/16, pending_count: 0, confirmed_brand: null, confirmed_booth: null, is_booked: false, is_bookable: group.bookable };
  });
}
