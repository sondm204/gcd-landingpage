"use client";
import { useLocalizedData } from "@/i18n/copy";
import Image from "next/image";

// Keep the proposal order; the footer also displays the organization groups.
const groupsSource = [
  { label: "ĐƠN VỊ BẢO TRỢ", logos: [
    { src: "/images/logo_danhnhan.png", alt: "Hội Doanh nhân trẻ Việt Nam" },
    { src: "/images/logo_VN.png", alt: "JCI Việt Nam" },
  ] },
  { label: "ĐƠN VỊ TỔ CHỨC", logos: [
    { src: "/images/JCI_VN.png", alt: "Hội đồng Phát triển JCI Việt Nam" },
    { src: "/images/jci-junior-division.png", alt: "JCI Junior Division" },
    { src: "/images/GCD_logo.png", alt: "Global Citizens Day" },
  ] },
  { label: "ĐƠN VỊ THỰC HIỆN", logos: [
    { src: "/images/logo_ThangLong.png", alt: "JCI Thăng Long" },
  ] },
  { label: "ĐƠN VỊ ĐỒNG HÀNH", logos: [
    { src: "/images/Logo_JCIHN.png", alt: "JCI Hà Nội" },
    { src: "/images/Logo_JCIHP.png", alt: "JCI Hải Phòng" },
    { src: "/images/Logo_JCIGrace.png", alt: "JCI Grace" },
    { src: "/images/Logo_JCICT.png", alt: "JCI Cần Thơ" },
    { src: "/images/junior_logo.png", alt: "JCI Junior Club" },
  ] },
];

export default function ProgramLogos({ duplicate = false, grouped = true }: { duplicate?: boolean; grouped?: boolean }) {
  const groups = useLocalizedData(groupsSource);
  if (!grouped) return <div className="program-logo-set program-logo-set-flat" aria-hidden={duplicate || undefined}>
    {groups.flatMap((group) => group.logos).map((logo) => <Image key={logo.src} src={logo.src} alt={duplicate ? "" : logo.alt} width={180} height={110} sizes="(max-width: 600px) 110px, 150px" />)}
  </div>;

  return <div className="program-logo-set" aria-hidden={duplicate || undefined}>
    {groups.map((group) => <div className="program-logo-group" key={group.label}>
      <span className="program-logo-label">{group.label}</span>
      <div className="program-logo-row">
        {group.logos.map((logo) => <Image key={logo.src} src={logo.src} alt={duplicate ? "" : logo.alt} width={180} height={110} sizes="(max-width: 600px) 110px, 150px" />)}
      </div>
    </div>)}
  </div>;
}
