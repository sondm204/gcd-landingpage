"use client";

import { useCopy } from "@/i18n/copy";

const routes = [
  "M1350 712H1133Q1118 712 1118 697V668Q1118 653 1103 653H683",
  "M493 727V398Q493 385 480 385H398",
  "M493 727Q493 740 480 740H345Q333 740 333 752V782",
];

export default function BoothPhotoScene({ markerId, onImageError }: { markerId: string; onImageError: () => void }) {
  const t = useCopy();

  return <g pointerEvents="none">
    <image href="/images/booth-venue-illustration.webp" x="0" y="0" width="1448" height="1086" aria-hidden="true" onError={onImageError} />
    <g className="booth-photo-hall-signs">
      <text x="724" y="85" fontSize="39" fill="#fff">{t("HỘI TRƯỜNG")}</text>
      <text x="550" y="142" fontSize="21">{t("Cửa")} 1</text>
      <text x="899" y="142" fontSize="21">{t("Cửa")} 2</text>
      <text x="724" y="128" fontSize="21">Backdrop<tspan x="724" dy="24">GCD</tspan></text>
      <text x="585" y="723" fontSize="17" fill="#891f34">{t("THẢM ĐỎ · CỬA 1")}</text>
      <text x="1305" y="582" fontSize="23">{t("boothMapCheckin")}</text>
    </g>
    <g className="booth-photo-floor-labels">
      <text x="117" y="234" fill="#075849">{t("boothMapCultureZone")}</text>
      <text x="655" y="320" fill="#634313">{t("boothMapSponsorZone")}</text>
      <text x="205" y="375" fontSize="18" fill="#075849">{t("boothMapWaiting")}<tspan x="205" dy="22">{t("boothMapExperience")}</tspan></text>
      <text x="1339" y="693" textAnchor="end" fill="#075849">{t("LỐI VÀO")}</text>
    </g>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-label={t("Hướng tham quan gợi ý")}>
      {routes.map(path => <path key={path} d={path} stroke="#e6f7ec" strokeWidth="11" opacity=".92" />)}
      {routes.map(path => <path key={path} d={path} stroke="#087d73" strokeWidth="5" markerEnd={`url(#${markerId}-visit)`} />)}
      <path d="M1040 653h-30M493 546v-30" stroke="#087d73" strokeWidth="5" markerEnd={`url(#${markerId}-visit)`} />
    </g>
    <path d="M575 682 568 246" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" markerEnd={`url(#${markerId}-carpet)`} aria-label={t("Thảm đỏ đi thẳng vào Cửa 1")} />
  </g>;
}
