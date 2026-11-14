import Image from "next/image";

// Keep the proposal order; the footer also displays the organization groups.
const groups = [
  { label: "ĐƠN VỊ BẢO TRỢ", logos: [
    { src: "/images/logo_danhnhan.png", alt: "Hội Doanh nhân trẻ Việt Nam" },
  ] },
  { label: "ĐƠN VỊ TỔ CHỨC", logos: [
    { src: "/images/logo_VN.png", alt: "JCI Việt Nam" },
    { src: "/images/GCD_logo.png", alt: "Global Citizens Day" },
  ] },
  { label: "ĐƠN VỊ THỰC HIỆN", logos: [
    { src: "/images/logo_ThangLong.png", alt: "JCI Thăng Long" },
    { src: "/images/junior_logo.png", alt: "JCI Junior Club" },
  ] },
];

export default function ProgramLogos({ duplicate = false, grouped = true }: { duplicate?: boolean; grouped?: boolean }) {
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
