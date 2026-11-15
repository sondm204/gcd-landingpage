export type Coordinate = { lat: number; lon: number };
export const ROUND_TIME = 20000;
export const CLOSE_KM = 100;
export const ROUND_COUNT = 10;
export const MAX_SCORE = 30;
export const requiredClose = (event: boolean) => event ? 1 : 7;
export const MAP_WIDTH = 600;
export const MAP_HEIGHT = 620;
export const bounds = { west: 101, east: 118, north: 24, south: 7 };
export const places = [
  { id: "01", name: "Vịnh Hạ Long", location: "Quảng Ninh", region: "Bắc", point: { lat: 20.8412, lon: 107.134 }, image: "/game/place/01.webp", author: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", source: "https://commons.wikimedia.org/wiki/File:Ha_Long_Bay,_Vietnam,_View_from_above.jpg", heritage: "https://whc.unesco.org/en/list/672/", fact: "Những đảo đá vôi giữa mặt nước tạo nên cảnh quan đặc trưng của Hạ Long. Đây là một phần của Di sản thế giới Vịnh Hạ Long – Quần đảo Cát Bà." },
  { id: "02", name: "Chùa Cầu · Phố cổ Hội An", location: "Hội An", region: "Trung", point: { lat: 15.8772, lon: 108.3268 }, image: "/game/place/02.webp", author: "Alice Stoecklin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Hoi_An_Japanische_Br%C3%BCcke.jpg", heritage: "https://whc.unesco.org/en/list/948/", fact: "Nhịp cầu có mái che là một dấu ấn của Hội An, đô thị thương cảng từng đón những cuộc gặp gỡ giữa văn hóa Việt và thế giới." },
  { id: "03", name: "Ngọ Môn · Cố đô Huế", location: "Huế", region: "Trung", point: { lat: 16.4694, lon: 107.5795 }, image: "/game/place/03.webp", author: "Bùi Thụy Đào Nguyên", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", source: "https://commons.wikimedia.org/wiki/File:Ng%E1%BB%8D_M%C3%B4n.png", heritage: "https://whc.unesco.org/en/list/678/", fact: "Ngọ Môn là cửa phía nam của Hoàng thành Huế. Công trình nằm trong quần thể di tích gắn với kinh đô dưới triều Nguyễn." },
  {"id":"04","name":"Khuê Văn Các · Văn Miếu","location":"Hà Nội","region":"Bắc","point":{"lat":21.0275,"lon":105.8355},"image":"/game/place/04.webp","author":"David Stanley","license":"CC BY 2.0","licenseUrl":"https://creativecommons.org/licenses/by/2.0","source":"https://commons.wikimedia.org/wiki/File:Khue_Van_Pavilion.jpg","heritage":"https://vanmieu.gov.vn/en/visit/architecture/khue-van-pavilion","fact":"Gác nhỏ với những ô cửa tròn là một hình ảnh gắn với truyền thống hiếu học của Hà Nội."},
  {"id":"05","name":"Quần thể danh thắng Tràng An","location":"Ninh Bình","region":"Bắc","point":{"lat":20.2506,"lon":105.916},"image":"/game/place/05.webp","author":"Benjamin Smith","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Trang_An_-_02.jpg","heritage":"https://whc.unesco.org/en/list/1438/","fact":"Núi đá vôi, những thung nước và các hang xuyên thủy tạo nên cảnh quan đặc trưng của Tràng An."},
  {"id":"06","name":"Thánh địa Mỹ Sơn","location":"Mỹ Sơn","region":"Trung","point":{"lat":15.764,"lon":108.124},"image":"/game/place/06.webp","author":"Philip Nalangan","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:My_Son_Sanctuary_Vietnam_02.jpg","heritage":"https://whc.unesco.org/en/list/949/","fact":"Những tháp gạch giữa thung lũng lưu giữ dấu ấn kiến trúc và tín ngưỡng của văn hóa Chăm."},
  {"id":"07","name":"Động Phong Nha","location":"Phong Nha – Kẻ Bàng","region":"Trung","point":{"lat":17.5824,"lon":106.2833},"image":"/game/place/07.webp","author":"Edgardo W. Olivera","license":"CC BY 2.0","licenseUrl":"https://creativecommons.org/licenses/by/2.0","source":"https://commons.wikimedia.org/wiki/File:Cueva_Phong_Nha,_Vietnam_(38652790530).jpg","heritage":"https://whc.unesco.org/en/list/951/","fact":"Dòng sông ngầm và những khối thạch nhũ mở ra một thế giới trong lòng núi đá vôi."},
  {"id":"08","name":"Dinh Độc Lập","location":"TP. Hồ Chí Minh","region":"Nam","point":{"lat":10.777,"lon":106.6955},"image":"/game/place/08.webp","author":"Alexis Lê-Quôc","license":"CC BY 2.0","licenseUrl":"https://creativecommons.org/licenses/by/2.0","source":"https://commons.wikimedia.org/wiki/File:Reunification_Palace_from_above.jpg","heritage":"https://commons.wikimedia.org/wiki/File:Reunification_Palace_from_above.jpg","fact":"Công trình giữa trung tâm thành phố là một dấu mốc lịch sử quen thuộc của Việt Nam."},
  {"id":"09","name":"Chợ Bến Thành","location":"TP. Hồ Chí Minh","region":"Nam","point":{"lat":10.7725,"lon":106.698},"image":"/game/place/09.webp","author":"Jean-Marie Hullot","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Ben_Thanh_Market.jpg","heritage":"https://commons.wikimedia.org/wiki/File:Ben_Thanh_Market.jpg","fact":"Tháp đồng hồ phía cổng chợ là một nét nhận diện của không gian giao thương ở trung tâm thành phố."},
  {"id":"10","name":"Chợ nổi Cái Răng","location":"Cần Thơ","region":"Nam","point":{"lat":10,"lon":105.75},"image":"/game/place/10.webp","author":"Trần Đăng Khoa / David (nlwiki)","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","source":"https://commons.wikimedia.org/wiki/File:Cho_noi_(Cai_Rang,_Can_Tho).JPG","heritage":"https://commons.wikimedia.org/wiki/File:Cho_noi_(Cai_Rang,_Can_Tho).JPG","fact":"Những chiếc ghe chở hàng trên sông gợi nhắc nhịp sống giao thương của miền Tây Nam Bộ."},
] as const;
export function project(p: Coordinate) {
  return { x: (p.lon - bounds.west) / (bounds.east - bounds.west) * MAP_WIDTH, y: (bounds.north - p.lat) / (bounds.north - bounds.south) * MAP_HEIGHT };
}
export function unproject(x: number, y: number): Coordinate {
  return { lon: bounds.west + x / MAP_WIDTH * (bounds.east - bounds.west), lat: bounds.north - y / MAP_HEIGHT * (bounds.north - bounds.south) };
}
export function validPoint(p: Coordinate) {
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lon >= bounds.west && p.lon <= bounds.east && p.lat >= bounds.south && p.lat <= bounds.north;
}
export function distanceKm(a: Coordinate, b: Coordinate) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export const pointsForDistance = (km: number) => Math.max(0, Math.round(MAX_SCORE * Math.exp(-Math.max(0, km) / 250)));
export function roundOrder(seed: number, event: boolean) {
  const order = places.map((_, i) => i);
  let value = seed >>> 0;
  for (let i = order.length - 1; i > 0; i--) { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; const j = value % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return order.slice(0, event ? 2 : ROUND_COUNT);
}
export type Result = { place: number; guess: Coordinate | null; distance: number | null; score: number; close: boolean; timedOut: boolean };
export type State = { phase: "ready" | "loading" | "playing" | "paused" | "review" | "result"; event: boolean; order: number[]; round: number; now: number; deadline: number; remaining: number; pin: Coordinate | null; results: Result[] };
export type Action = { type: "start"; seed: number } | { type: "reset" } | { type: "loaded"; now: number } | { type: "tick"; now: number } | { type: "pin"; now: number; point: Coordinate } | { type: "submit"; now: number } | { type: "pause"; now: number } | { type: "resume"; now: number } | { type: "next" };
export function initialState(event = false): State { return { phase: "ready", event, order: [], round: 0, now: 0, deadline: 0, remaining: ROUND_TIME, pin: null, results: [] }; }
function finish(s: State, timedOut: boolean): State {
  const place = s.order[s.round];
  const distance = s.pin ? distanceKm(s.pin, places[place].point) : null;
  return { ...s, phase: "review", remaining: 0, results: [...s.results, { place, guess: s.pin, distance, score: distance === null ? 0 : pointsForDistance(distance), close: distance !== null && distance < CLOSE_KM, timedOut }] };
}
function advance(s: State, now: number) {
  const next = { ...s, now: Math.max(s.now, now) };
  return next.now >= next.deadline ? finish(next, true) : next;
}
export function reducer(s: State, a: Action): State {
  if (a.type === "reset") return initialState(s.event);
  if (a.type === "start") return s.phase === "ready" ? { ...initialState(s.event), phase: "loading", order: roundOrder(a.seed, s.event) } : s;
  if (a.type === "loaded") return s.phase === "loading" ? { ...s, phase: "playing", now: a.now, deadline: a.now + ROUND_TIME, remaining: ROUND_TIME } : s;
  if (a.type === "next") return s.phase !== "review" ? s : s.round + 1 === s.order.length ? { ...s, phase: "result" } : { ...s, phase: "loading", round: s.round + 1, pin: null, remaining: ROUND_TIME };
  if (a.type === "resume") return s.phase === "paused" ? { ...s, phase: "playing", now: Math.max(s.now, a.now), deadline: Math.max(s.now, a.now) + s.remaining } : s;
  if (s.phase !== "playing") return s;
  const next = advance(s, a.now);
  if (next.phase !== "playing") return next;
  if (a.type === "pause") return { ...next, phase: "paused", remaining: next.deadline - next.now };
  if (a.type === "pin") return validPoint(a.point) ? { ...next, pin: a.point } : next;
  if (a.type === "submit") return next.pin ? finish(next, false) : next;
  return next;
}
