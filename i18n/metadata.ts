import type { Metadata } from "next";
import { event } from "@/lib/event";
import { siteUrl, siteTitle } from "@/lib/site-metadata";

export function localizedMetadata(locale: string, path = ""): Metadata {
  const en = locale === "en";
  const url = (en ? "/en" : "") + path || "/";
  const title = path ? (en ? "Booths — Global Citizens Day 2026" : "Gian hàng — Global Citizens Day 2026") : siteTitle;
  const description = path
    ? en ? "Choose a booth location and submit your proposal for Global Citizens Day 2026. Locations are confirmed after organizer approval." : "Chọn vị trí gian hàng và gửi đề xuất tham gia Global Citizens Day 2026. Vị trí được xác nhận sau khi ban tổ chức phê duyệt."
    : en ? "Vietnam Roots – Global Minds. Join us on Sunday, 6 December 2026 at Nguyễn Văn Đạo Auditorium, Vietnam National University, Hanoi. Know your roots, build confidence and shape a global future." : `${event.slogan}. Hẹn bạn ${event.date} tại ${event.venue}, ${event.address}. Hiểu cội nguồn, vững bản lĩnh, khai mở tư duy toàn cầu và kiến tạo tương lai.`;
  return {
    metadataBase: siteUrl, title, description,
    alternates: { canonical: url, languages: { vi: path || "/", en: "/en" + path, "x-default": path || "/" } },
    openGraph: { type: "website", url, locale: en ? "en_US" : "vi_VN", alternateLocale: en ? "vi_VN" : "en_US", title, description, siteName: event.name, images: [{ url: `${en ? "/en" : ""}/opengraph-image`, width: 1200, height: 630, alt: siteTitle }] },
    twitter: { card: "summary_large_image", title, description, images: [`${en ? "/en" : ""}/twitter-image`] },
  };
}
