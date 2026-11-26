import type { BoothPosition } from "@/lib/booths/types";

export type MapBounds = { x: number; y: number; w: number; h: number };

// Front signs in the fixed 1448 × 1086 venue image, ordered by booth code.
const commercialSigns = [
  [397, 502], [397, 565], [396, 625], [396, 682],
  [377, 775, 86], [467, 775, 84], [555, 775, 85], [645, 775, 85],
  [734, 775, 84], [822, 775, 85], [911, 775, 83],
  [1015, 774, 92], [1019, 820, 92], [1023, 869, 92], [1028, 919, 92], [1032, 970, 92],
  [663, 514], [664, 568], [750, 568], [835, 568], [918, 568], [1000, 568], [1082, 568], [1165, 568],
];

const sponsorSigns = [
  [660, 340, 87, 28], [760, 341, 88, 28], [863, 341, 87, 28],
  [662, 396, 87, 29], [663, 449, 87, 29],
  [661, 225, 157, 45], [873, 225, 236, 46], [978, 338, 154, 43],
];

const cultureSigns = [
  [117, 272, 107, 37], [264, 272, 114, 37], [75, 363, 98, 39],
  [138, 452, 107, 39], [273, 451, 105, 40],
];

export function boothPhotoBounds(booth: BoothPosition): MapBounds {
  const signs = booth.code.startsWith("TM") ? commercialSigns : booth.code.startsWith("TT") ? sponsorSigns : cultureSigns;
  const sign = signs[Number(booth.code.slice(2)) - 1];
  if (!sign) return boothMapBounds(booth);
  const [x, y, w = 81, h = 28] = sign;
  return { x, y, w, h };
}

/** Display coordinates only; persisted position IDs and venue data are untouched. */
export function boothMapBounds(booth: BoothPosition): MapBounds {
  const n = Number(booth.code.slice(2));
  if (booth.code.startsWith("TM") && n >= 1 && n <= 24) {
    const w = 86, h = 54;
    if (n <= 4) return { x: 500, y: 710 + (n - 1) * 66, w, h };
    if (n <= 11) return { x: 500 + (n - 5) * 98, y: 1030, w, h };
    if (n <= 16) return { x: 1190, y: 1030 + (n - 12) * 66, w, h };
    if (n === 17) return { x: 780, y: 770, w, h };
    return { x: 780 + (n - 18) * 96, y: 850, w, h };
  }
  if (booth.code.startsWith("TT") && n >= 1 && n <= 8) {
    if (n === 6) return { x: 780, y: 445, w: 170, h: 76 };
    if (n === 7) return { x: 970, y: 445, w: 300, h: 76 };
    if (n === 8) return { x: 1090, y: 565, w: 180, h: 82 };
    if (n <= 3) return { x: 780 + (n - 1) * 98, y: 570, w: 86, h: 54 };
    return { x: 780, y: 636 + (n - 4) * 66, w: 86, h: 54 };
  }
  if (booth.code.startsWith("VH") && n >= 1 && n <= 5) {
    const points = [[155, 485], [325, 485], [115, 580], [165, 675], [335, 675]];
    return { x: points[n - 1][0], y: points[n - 1][1], w: 136, h: 76 };
  }
  return { x: booth.x * 16, y: booth.y * 16, w: booth.width * 16, h: booth.height * 16 };
}
