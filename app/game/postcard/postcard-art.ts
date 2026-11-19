import type { frames } from "./model";

type Frame = typeof frames[number];

/** Shared, deterministic artwork for both the live paper and the downloaded PNG. */
export function postcardArtwork(frame: Frame) {
  const { paper, ink, accent, id } = frame;
  let seed = 2026;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const fibers = Array.from({ length: 460 }, () => {
    const x = (random() * 1200).toFixed(1), y = (random() * 1500).toFixed(1);
    return `<path d="M${x} ${y}q${(random() * 10 - 5).toFixed(1)} -2 ${(random() * 16 + 3).toFixed(1)} ${(random() * 4 - 2).toFixed(1)}"/>`;
  }).join("");
  const lotus = (x: number, y: number, scale: number) => `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${accent}" stroke-width="1.5"><path d="M0 0C-32-20-27-55 0-76C27-55 32-20 0 0ZM0 0C-45 0-66-22-64-51C-35-51-8-31 0 0ZM0 0C45 0 66-22 64-51C35-51 8-31 0 0ZM0 0C-39 12-67 0-84-24C-49-32-19-18 0 0ZM0 0C39 12 67 0 84-24C49-32 19-18 0 0ZM0-66V0M-56-44Q-26-35 0 0M56-44Q26-35 0 0M-85 12Q0 30 85 12"/></g>`;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = i * Math.PI / 8, b = a + Math.PI / 16;
    return `${(Math.sin(a) * 54).toFixed(2)},${(Math.cos(a) * 54).toFixed(2)} ${(Math.sin(b) * 24).toFixed(2)},${(Math.cos(b) * 24).toFixed(2)}`;
  }).join(" ");
  const drum = `<g transform="translate(1050 1210)" fill="none" stroke="${accent}"><circle r="86"/><circle r="79"/><circle r="66" stroke-dasharray="1 5"/><polygon points="${rays}" fill="${accent}" stroke="none"/></g>`;
  const waves = Array.from({ length: 5 }, (_, i) => `<path d="M70 ${1453 - i * 7}q70 -27 140 0t140 0t140 0t140 0t140 0t140 0t140 0"/>`).join("");
  const corners = ["translate(42 42)", "translate(1158 42) rotate(90)", "translate(1158 1458) rotate(180)", "translate(42 1458) rotate(270)"].map(transform => `<g transform="${transform}" fill="none" stroke="${accent}" stroke-width="2"><path d="M0 76V0H76M9 53V9H53M18 32V18H32"/></g>`).join("");
  const ornament = id === "vermilion" ? drum : id === "horizon" ? `<g fill="none" stroke="${accent}" stroke-width="1.5">${waves}</g>${lotus(1080, 1228, .85)}` : `${lotus(110, 1240, .9)}${lotus(1080, 1450, 1.05)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs>
      <linearGradient id="paper" x2=".8" y2="1"><stop stop-color="#fffcf5"/><stop offset=".45" stop-color="${paper}"/><stop offset="1" stop-color="${paper}"/></linearGradient>
      <linearGradient id="foil"><stop stop-color="${accent}"/><stop offset=".42" stop-color="#e0c084"/><stop offset=".65" stop-color="${accent}"/><stop offset="1" stop-color="#9c753a"/></linearGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch" seed="26"/><feColorMatrix type="saturate" values="0"/></filter>
      <pattern id="weave" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0H6M0 0V6" fill="none" stroke="${ink}" stroke-width=".3" opacity=".09"/></pattern>
    </defs>
    <rect width="1200" height="1500" fill="url(#paper)"/>
    <rect width="1200" height="1500" filter="url(#grain)" opacity=".075"/>
    <rect width="1200" height="1500" fill="url(#weave)"/>
    <g fill="none" stroke="${ink}" stroke-width=".65" opacity=".09">${fibers}</g>
    <g opacity=".72"><rect x="24" y="24" width="1152" height="1452" rx="1" fill="none" stroke="url(#foil)" stroke-width="2"/><rect x="31" y="31" width="1138" height="1438" fill="none" stroke="${accent}" stroke-width=".5"/>${corners}</g>
    <g opacity=".19">${ornament}</g>
    <path d="M62 814H1138" stroke="${accent}" stroke-width=".6" opacity=".3"/>
  </svg>`;
}

export function postcardArtworkUrl(frame: Frame) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(postcardArtwork(frame))}`;
}
