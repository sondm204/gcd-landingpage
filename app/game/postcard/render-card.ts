import { frames, type Draft } from "./model";
import { places } from "../place/engine";

/** Local photograph + canvas text only; no remote assets or user uploads. */
export async function renderCard(draft: Draft) {
  const place = places[draft.place];
  const frame = frames.find(f => f.id === draft.frame) || frames[0];
  const image = new window.Image(); image.src = place.image;
  await Promise.all([image.decode(), document.fonts.ready]);
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1500;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Thiết bị chưa hỗ trợ xuất postcard.");
  ctx.fillStyle = frame.paper; ctx.fillRect(0, 0, 1200, 1500);
  ctx.strokeStyle = frame.accent; ctx.lineWidth = 2; ctx.strokeRect(24, 24, 1152, 1452);
  ctx.fillStyle = frame.ink; ctx.textAlign = "left"; ctx.font = "600 17px Arial";
  ctx.fillText("FROM VIETNAM, WITH HERITAGE", 60, 76);
  ctx.textAlign = "right"; ctx.fillText("GCD 2026", 1140, 76);
  const ratio = Math.max(1080 / image.naturalWidth, 690 / image.naturalHeight);
  ctx.save(); ctx.beginPath(); ctx.rect(60, 108, 1080, 690); ctx.clip();
  ctx.drawImage(image, 60 + (1080 - image.naturalWidth * ratio) / 2, 108 + (690 - image.naturalHeight * ratio) / 2, image.naturalWidth * ratio, image.naturalHeight * ratio); ctx.restore();
  ctx.textAlign = "center"; ctx.fillStyle = frame.accent; ctx.font = "20px Arial"; ctx.fillText("✦  VIETNAM ROOTS · GLOBAL MINDS  ✦", 600, 848);
  ctx.fillStyle = frame.ink;
  ctx.font = "600 40px Georgia"; wrap(place.name, 600, 910, 1050, 48);
  const message = draft.message.trim() || "Your story starts here…";
  let fontSize = 44;
  ctx.font = `italic ${fontSize}px Georgia`;
  while (fontSize > 18 && wrap(message, 0, 0, 970, 1, false) * fontSize * 1.25 > 220) { fontSize -= 2; ctx.font = `italic ${fontSize}px Georgia`; }
  wrap(message, 600, 1025, 970, fontSize * 1.25);
  ctx.font = "22px Arial"; ctx.fillText(draft.sender.trim() ? `From ${draft.sender.trim()}` : "A friend from Vietnam", 600, 1274);
  ctx.strokeStyle = frame.accent; ctx.beginPath(); ctx.moveTo(160, 1310); ctx.lineTo(1040, 1310); ctx.stroke();
  ctx.textAlign = "left"; ctx.font = "14px Arial"; ctx.fillStyle = frame.ink;
  wrap(`Photo: ${place.author} · ${place.license} · Cropped, resized and framed.`, 60, 1348, 1080, 19);
  ctx.font = "12px Arial"; wrap(place.licenseUrl, 60, 1390, 1080, 17); wrap(place.source, 60, 1413, 1080, 17);
  return canvas.toDataURL("image/png");

  function wrap(text: string, x: number, y: number, width: number, lineHeight: number, draw = true) {
    const tokens = text.trim().split(/\s+/).flatMap(word => {
      // Break even a long URL or a single unspaced word so it never escapes the card.
      const pieces: string[] = []; let chunk = "";
      for (const ch of word) { if (ctx!.measureText(chunk + ch).width > width && chunk) { pieces.push(chunk); chunk = ""; } chunk += ch; }
      if (chunk) pieces.push(chunk); return pieces;
    });
    let line = "", count = 0;
    for (const word of tokens) { const next = line ? `${line} ${word}` : word; if (ctx!.measureText(next).width > width && line) { if (draw) ctx!.fillText(line, x, y); count++; y += lineHeight; line = word; } else line = next; }
    if (line) { if (draw) ctx!.fillText(line, x, y); count++; }
    return count;
  }
}
