import type { ProductId } from "./engine";

/** Reuse identical artwork on the shelf, customer orders and delivery tray. */
export default function ProductArt({ id }: { id: ProductId }) {
  return <svg className="craft-product-art" viewBox="0 0 140 110" aria-hidden="true" focusable="false">
    <image href={`/game/craft-shop/${id}.webp`} width="140" height="110" preserveAspectRatio="xMidYMid meet" />
  </svg>;
}
