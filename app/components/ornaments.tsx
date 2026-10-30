import type { CSSProperties } from "react";

export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function Sun({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="50" cy="50" r="12" stroke="currentColor" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M50 3L54 25L50 21L46 25Z" fill="currentColor" transform={`rotate(${i * 22.5} 50 50)`} />
      ))}
    </svg>
  );
}

export function Lotus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" aria-hidden="true">
      <path d="M100 132C70 108 68 59 100 18C130 59 130 108 100 132Z" fill="#e2b557" stroke="#997029" />
      <path d="M100 132C59 124 34 83 42 45C80 56 100 92 100 132Z" fill="#f2ce7c" stroke="#997029" />
      <path d="M100 132C141 124 166 83 158 45C120 56 100 92 100 132Z" fill="#f2ce7c" stroke="#997029" />
      <path d="M100 132C49 142 17 105 12 77C52 75 84 94 100 132Z" fill="#ffe5a5" stroke="#997029" />
      <path d="M100 132C151 142 183 105 188 77C148 75 116 94 100 132Z" fill="#ffe5a5" stroke="#997029" />
      <path d="M100 132C77 96 68 78 42 45M100 132C123 96 132 78 158 45M100 132V30" stroke="#fff4d6" strokeWidth="1.5" />
      <path d="M100 137C60 151 30 145 20 130C55 118 80 126 100 137ZM100 137C140 151 170 145 180 130C145 118 120 126 100 137Z" fill="#174d9d" />
    </svg>
  );
}

export function Lantern({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 230" aria-hidden="true">
      <path d="M60 0V49" stroke="#ae873d" strokeWidth="1.2" />
      <path d="M43 49Q60 43 77 49L84 63Q120 119 80 166L68 177H52L40 166Q0 119 36 63Z" fill="#125ac4" stroke="#08275c" />
      <path d="M47 54Q22 118 52 172M60 52V176M73 54Q98 118 68 172" stroke="#ffe2a0" strokeWidth="1.5" fill="none" />
      <path d="M38 65H82M38 155H82M49 178H71M55 180V218M60 180V226M65 180V218" stroke="#d6ab52" strokeWidth="3" />
    </svg>
  );
}
