import type { StageId } from "./stages";

export function StageIcon({ id }: { id: StageId }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {id === "craft" && <><path d="M10 5h12M12 5v6c0 3-6 4-6 10a10 10 0 0 0 20 0c0-6-6-7-6-10V5M7 21h18M10 26h12" /><path d="m12 16 4 3 4-3" /></>}
    {id === "print" && <><rect x="5" y="5" width="22" height="22" rx="2" /><path d="M5 13h22M13 5v22M21 13v14M13 21h14" /></>}
    {id === "rhythm" && <><path d="M12 23V8l14-3v15M12 13l14-3" /><ellipse cx="8" cy="24" rx="4" ry="3" /><ellipse cx="22" cy="21" rx="4" ry="3" /></>}
    {id === "place" && <><path d="M25 13c0 7-9 15-9 15S7 20 7 13a9 9 0 1 1 18 0Z" /><circle cx="16" cy="13" r="3" /></>}
    {id === "postcard" && <><rect x="3" y="6" width="26" height="20" rx="2" /><path d="m3 8 13 10L29 8M20 22h5" /></>}
  </svg>;
}

export function StageArt({ id }: { id: StageId }) {
  return <svg className="game-stage-art" viewBox="0 0 240 180" fill="none" aria-hidden="true">
    <circle cx="130" cy="87" r="66" fill="currentColor" opacity=".08" />
    <circle cx="130" cy="87" r="57" stroke="currentColor" strokeDasharray="2 6" opacity=".24" />
    <path d="m34 41 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM204 123l2-5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" opacity=".5" />
    {id === "craft" && <>
      <path d="M42 143h156" stroke="currentColor" opacity=".3" />
      <path d="m142 128 31-71 35 60Z" fill="#eac77d" stroke="#8c642f" strokeWidth="2" />
      <path d="m173 60-6 62m6-62 15 59m-15-59 29 55m-29-55-25 63" stroke="#b78b48" />
      <path d="M96 39h36l-4 27c-1 11 22 17 22 41 0 21-13 34-36 34s-36-13-36-34c0-24 23-30 22-41Z" fill="#f6f0df" stroke="#315c8d" strokeWidth="2.5" />
      <path d="M98 46h32M81 101h66M81 114h66M94 135h40" stroke="#315c8d" strokeWidth="2" />
      <path d="m90 107 8 5 8-5 8 5 8-5 8 5 8-5M110 61h8v20h-8z" stroke="#315c8d" strokeWidth="1.5" />
      <path d="M101 86c4-7 9-7 13 0 4-7 9-7 13 0-4 8-9 10-13 14-4-4-9-6-13-14Z" fill="#315c8d" opacity=".7" />
    </>}
    {id === "print" && <>
      <g transform="rotate(-8 123 90)"><rect x="68" y="30" width="109" height="125" rx="3" fill="#a65b40" /><rect x="74" y="36" width="97" height="113" fill="#fff2d0" /><path d="M82 131h81M83 139h51" stroke="#b5804f" />
      <path d="M110 120c-23-12-25-34-8-48 7-6 26-9 35 6 14 2 22 14 20 26-2 14-26 22-47 16Z" fill="#cf9140" stroke="#654c34" strokeWidth="2" />
      <path d="M135 82c10-9 8-22 0-27l8-8 4 13 8 1-8 10 2 12M101 79c-19-9-20-23-12-24 10-2 5 14 15 14-1-13 5-22 11-19 8 5-7 16-5 22" fill="#b74b3b" stroke="#654c34" strokeWidth="2" />
      <path d="M112 85c22-8 30 18 11 25-10 4-22-1-23-11M115 121l-4 10m18-10 5 10" stroke="#654c34" strokeWidth="2" /><circle cx="143" cy="75" r="2" fill="#654c34" /></g>
      <path d="M48 123h20v20H48z" fill="#d8a544" /><path d="M173 39h20v20h-20z" fill="#70836d" />
    </>}
    {id === "rhythm" && <>
      <path d="M48 76c17-22 34-22 51 0s34 22 51 0 34-22 51 0M48 99c17-22 34-22 51 0s34 22 51 0 34-22 51 0" stroke="currentColor" opacity=".23" />
      <ellipse cx="123" cy="115" rx="48" ry="18" fill="#b98251" stroke="#79503d" strokeWidth="2" />
      <path d="M75 99v16c0 24 96 24 96 0V99" fill="#9c5749" stroke="#79503d" strokeWidth="2" />
      <ellipse cx="123" cy="98" rx="48" ry="19" fill="#f4ddb0" stroke="#79503d" strokeWidth="2" />
      <ellipse cx="123" cy="98" rx="32" ry="12" stroke="#b58751" /><path d="m118 93 10 10m-10 0 10-10M88 120v-13m14 19v-14m43 13v-14m14 9v-13" stroke="#e9bf7a" strokeWidth="2" />
      <path d="m85 57 30 36m45-39-28 39" stroke="#79503d" strokeWidth="6" strokeLinecap="round" />
      <path d="M155 47V28l16-4v18" stroke="currentColor" strokeWidth="2" /><ellipse cx="151" cy="47" rx="5" ry="4" fill="currentColor" /><ellipse cx="167" cy="42" rx="5" ry="4" fill="currentColor" />
    </>}
    {id === "place" && <>
      <path d="m43 132 17-30 15 9 24-56 21 44 17-22 29 55Z" fill="#9cb6ac" /><path d="m72 132 29-45 13 21 16-46 28 70" fill="#5f8f84" />
      <path d="M39 139c26-7 38 7 64 0s38 7 64 0 24 4 35 0M49 148c26-7 38 7 64 0s38 7 64 0" stroke="#77a6a6" strokeWidth="2" />
      <path d="M187 52c0 19-24 39-24 39s-24-20-24-39a24 24 0 0 1 48 0Z" fill="#e2b766" stroke="#8f6a34" strokeWidth="2" /><circle cx="163" cy="52" r="8" fill="#fcf3db" stroke="#8f6a34" strokeWidth="2" />
      <path d="M148 130h32l-5-11h-22Z" fill="#9b643f" /><path d="m160 115 1-18 12 18Z" fill="#e0bc79" />
    </>}
    {id === "postcard" && <>
      <g transform="rotate(-9 126 88)"><rect x="52" y="43" width="145" height="96" rx="3" fill="#fcf3db" stroke="#ac9567" strokeWidth="2" /><path d="M132 56v70" stroke="#cbb890" /><path d="M145 94h37m-37 12h30m-30 12h34" stroke="#b09b77" strokeWidth="2" /><path d="M169 54h17v21h-17z" stroke="#b09b77" strokeDasharray="2 2" /><path d="m173 68 5-8 5 8" stroke="#b09b77" />
      <path d="M65 120h56M69 115V86h48v29M77 94h8v21m14-21h8v21M64 85h58l-7-8H71l-7 8Zm7-9h44l-8-9H79Z" fill="#cdac61" stroke="#896a37" strokeWidth="1.5" /><path d="M87 69V57h12v12" stroke="#896a37" strokeWidth="2" /></g>
      <path d="m171 133 20-12-7 23-4-9-9-2Z" fill="#7594b9" />
    </>}
  </svg>;
}

export function PassportArt() {
  return <div className="game-passport-scene" aria-hidden="true">
    <div className="game-orbit game-orbit-one" /><div className="game-orbit game-orbit-two" />
    <span className="game-scene-star game-star-one">✦</span><span className="game-scene-star game-star-two">✧</span>
    <div className="game-passport-ticket"><span>VIETNAM ROOTS</span><b>05 CHẶNG</b><span>GLOBAL MINDS</span></div>
    <div className="game-passport-book"><div className="game-passport-inner">
      <span className="game-passport-brand">GLOBAL CITIZENS DAY 2026</span>
      <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="42" stroke="currentColor" /><circle cx="50" cy="50" r="35" stroke="currentColor" strokeDasharray="1 5" /><path d="M50 13v74M13 50h74M20 29h60M20 71h60M50 13c-30 21-30 53 0 74 30-21 30-53 0-74Z" stroke="currentColor" opacity=".6" /><path d="m28 61 22-31 22 31H28Zm6 0v14h32V61M43 75V62h14v13M30 54h40" fill="#133c72" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span className="game-passport-title">HỘ CHIẾU<br />DI SẢN</span><span className="game-passport-subtitle">HERITAGE PASSPORT</span>
      <span className="game-passport-flower">✧</span>
    </div></div>
    <div className="game-passport-seal">HÀNH TRÌNH VIỆT<span>✦</span>CHẠM VÀO DI SẢN</div>
  </div>;
}
