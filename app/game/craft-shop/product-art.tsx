import type { ProductId } from "./engine";

export default function ProductArt({ id }: { id: ProductId }) {
  return <svg viewBox="0 0 140 110" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="70" cy="96" rx="43" ry="5" fill="#17375b" opacity=".08" />
    {id === "pot" && <g stroke="#41668d" strokeWidth="2"><path d="M57 17h26l-3 22c0 9 20 15 20 33 0 17-11 24-30 24S40 89 40 72c0-18 20-24 20-33Z" fill="#fffaf0" /><path d="M58 24h24M42 73h56M45 84h50M55 91h30M55 62l15-10 15 10-15 11Z" /><path d="m48 78 7 4 8-4 7 4 7-4 8 4 7-4" /></g>}
    {id === "silk" && <g stroke="#a25c71" strokeWidth="2"><path d="m36 25 60-9 13 68-59 12Z" fill="#e6a4b5" /><path d="m36 25 15 15 58-10M51 40l-1 56M57 48l34-6M60 60l34-6M62 72l34-6M52 96v6m8-7v6m8-7v6m8-7v6m8-7v6m8-7v6m8-7v6" /><path d="m69 51 9-6 8 7-9 6Z" fill="#f9e3d9" /></g>}
    {id === "basket" && <g stroke="#94703d" strokeWidth="2"><path d="M47 49c0-41 46-41 46 0" strokeWidth="6" /><path d="m29 46 12 46h58l12-46Z" fill="#dfba7c" /><path d="M34 58h73M37 70h67M40 82h61M43 47l9 44m8-44 4 44m13-44-2 44m18-44-7 44M27 46h86" /></g>}
    {id === "fan" && <g stroke="#75845c" strokeWidth="2"><path d="M70 95 15 49c20-40 90-40 110 0Z" fill="#e7eac8" /><path d="M70 95 27 34m43 61L46 23m24 72V19m0 76 24-72M70 95l43-61M27 59c26-25 60-25 86 0" /><circle cx="70" cy="95" r="4" fill="#8b6a3e" /></g>}
    {id === "hat" && <g stroke="#a58b4c" strokeWidth="2"><path d="m70 22 56 59c-26 20-86 20-112 0Z" fill="#f4df9d" /><path d="M31 64c22 12 56 12 78 0M46 48c14 8 34 8 48 0M22 74c25 16 71 16 96 0M70 22 47 90m23-68 23 68M52 95q18 20 36 0" /></g>}
  </svg>;
}
