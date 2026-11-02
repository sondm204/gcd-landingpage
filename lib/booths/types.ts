export type ProposalStatus = "pending" | "approved" | "rejected";
export const BOOTH_COUNT = 24;
export const POSITION_COUNT = 25;
export const BOOTH_ZONES = [
  {
    name: "Hạ Long", icon: "nature", firstId: 1, lastId: 8, color: "#176b67", background: "#e9f6f1",
    theme: "Thiên nhiên & cuộc sống xanh",
    description: "Kể câu chuyện về thiên nhiên, môi trường và cách con người sống hài hòa với cảnh quan địa phương.",
    examples: ["Sản phẩm thân thiện môi trường", "Du lịch sinh thái, khám phá thiên nhiên", "Trải nghiệm bảo tồn và sống xanh"],
    prompt: "Sản phẩm hoặc trải nghiệm của bạn giúp khách hiểu và gắn kết với thiên nhiên như thế nào?",
  },
  {
    name: "Văn Miếu", icon: "knowledge", firstId: 9, lastId: 16, color: "#8a4e24", background: "#fff4e5",
    theme: "Tri thức, di sản & giá trị truyền thống",
    description: "Chia sẻ kiến thức, gìn giữ di sản và giúp khách khám phá những giá trị truyền thống qua trải nghiệm thực tế.",
    examples: ["Sách, thư pháp và văn hóa chữ", "Workshop làng nghề, tìm hiểu di sản", "Hoạt động giáo dục và kể chuyện truyền thống"],
    prompt: "Bạn sẽ chia sẻ kiến thức, câu chuyện di sản hoặc giá trị truyền thống nào với khách tham dự?",
  },
  {
    name: "Hội An", icon: "culture", firstId: 17, lastId: 24, color: "#3452a1", background: "#edf1ff",
    theme: "Văn hóa Việt vươn ra thế giới",
    description: "Giới thiệu cách sản phẩm và câu chuyện văn hóa Việt đến với khách quốc tế, hướng tới thị trường xuất khẩu.",
    examples: ["Thủ công, quà tặng mang bản sắc Việt", "Ẩm thực, sản phẩm văn hóa hướng tới khách quốc tế", "Thiết kế sáng tạo và câu chuyện thương hiệu Việt"],
    prompt: "Bạn sẽ kể câu chuyện văn hóa Việt và giới thiệu sản phẩm tới khách quốc tế như thế nào?",
  },
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
};

// Coordinates are percentages of a 1000 × 760 concept plan.
export function conceptPositions(): BoothPosition[] {
  return Array.from({ length: POSITION_COUNT }, (_, i) => {
    const id = i + 1;
    const bookable = id <= BOOTH_COUNT;
    const group = Math.floor(i / 8), slot = i % 8;
    const x = bookable ? 11 + group * 28 + (slot % 2) * 11 : 45.5;
    const y = bookable ? 33 + Math.floor(slot / 2) * 11 : 86;
    return { id, code: `B${String(id).padStart(2, "0")}`, zone: zoneForPosition(id)?.name ?? "Quầy đổi quà", x, y, width: 9, height: 8, pending_count: 0, confirmed_brand: null, confirmed_booth: null, is_booked: false, is_bookable: bookable };
  });
}
