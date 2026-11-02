import Image from "next/image";
import { Arrow } from "./ornaments";

// Editorial summaries of official JCI publications; each activity links to its source.
const activities = [
  {
    category: "PHÁT TRIỂN NGƯỜI TRẺ",
    title: "Lead Your Future",
    description: "Phối hợp cùng Trung tâm Chuyển giao Tri thức & Hỗ trợ Khởi nghiệp – ĐHQGHN tổ chức chương trình định hướng nghề nghiệp và hội nhập cho người trẻ, startup và doanh nghiệp SMEs.",
    href: "https://jci.vn/lead-your-future-tu-hao-viet-nam-san-sang-ra-bien-lon/",
  },
  {
    category: "KẾT NỐI DOANH NGHIỆP",
    title: "Momentum Talks",
    description: "Cùng JCI South Saigon tổ chức buổi chia sẻ về bán hàng xuyên biên giới và thương mại điện tử, mở thêm góc nhìn cho doanh nghiệp Việt trong hành trình hội nhập.",
    href: "https://jci.vn/ban-hang-xuyen-bien-gioi-cau-chuyen-thuong-mai-dien-tu/",
  },
  {
    category: "PHỤNG SỰ CỘNG ĐỒNG",
    title: "Tết Yêu Thương 2025",
    description: "Phối hợp cùng các đơn vị cộng đồng và giáo dục tổ chức đêm hội Trung thu cho người khuyết tật và trẻ em có hoàn cảnh đặc biệt, kết nối sự sẻ chia qua những hoạt động thiết thực.",
    href: "https://jci.vn/tet-trung-thu-tet-yeu-thuong-2025/",
  },
];

export default function OrganizerSection() {
  return <section className="organizer-section section-pad" id="don-vi-to-chuc" aria-labelledby="organizer-title">
    <div className="organizer-intro">
      <div className="organizer-identity" data-reveal>
        <span className="eyebrow">ĐƠN VỊ TỔ CHỨC</span>
        <a href="https://jcithanglong.vn/" target="_blank" rel="noopener noreferrer" aria-label="Website JCI Thăng Long — mở trong tab mới">
          <Image src="/images/logo_ThangLong.png" alt="JCI Thăng Long" width={500} height={281} sizes="(max-width: 700px) 60vw, 240px" />
        </a>
        <span className="organizer-affiliation">Chi hội thuộc JCI Việt Nam</span>
      </div>
      <div className="organizer-copy" data-reveal data-reveal-delay="80">
        <h2 id="organizer-title">JCI Thăng Long<br /><em>Kết nối để cùng kiến tạo.</em></h2>
        <p>JCI Thăng Long hướng tới phát triển những công dân trẻ tích cực thông qua giáo dục, kết nối nguồn lực và các hoạt động vì cộng đồng. Phát triển con người, thúc đẩy hợp tác và tạo giá trị bền vững là những định hướng xuyên suốt của chi hội.</p>
        <a className="text-link organizer-link" href="https://jcithanglong.vn/" target="_blank" rel="noopener noreferrer">Tìm hiểu JCI Thăng Long <Arrow /></a>
      </div>
    </div>
    <div className="organizer-activities-heading" data-reveal>
      <div><span className="eyebrow">NĂNG LỰC QUA NHỮNG HOẠT ĐỘNG THỰC TẾ</span><h3>Từ kết nối đến hành động.</h3></div>
      <a className="text-link organizer-link" href="https://jci.vn/chapters/jci-thanglong/" target="_blank" rel="noopener noreferrer">Xem các hoạt động trên JCI Việt Nam <Arrow /></a>
    </div>
    <div className="organizer-activities">
      {activities.map((activity, index) => <a className="organizer-activity" href={activity.href} target="_blank" rel="noopener noreferrer" key={activity.title} data-reveal data-reveal-delay={index * 70}>
        <span className="organizer-activity-top"><span>{activity.category}</span><span aria-hidden="true">0{index + 1}</span></span>
        <h4>{activity.title}</h4>
        <p>{activity.description}</p>
        <span className="organizer-activity-more">Đọc câu chuyện hoạt động <span aria-hidden="true">↗</span></span>
      </a>)}
    </div>
  </section>;
}
