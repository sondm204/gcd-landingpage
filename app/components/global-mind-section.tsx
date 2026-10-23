const pillars = [
  { name: "Hiểu về cội nguồn", en: "ROOTS", text: "Hiểu câu chuyện phía sau một giá trị Việt, để biết mình mang điều gì vào cuộc đối thoại với thế giới.", question: "Bạn muốn giới thiệu điều gì về Việt Nam?" },
  { name: "Vững vàng bản lĩnh", en: "IDENTITY", text: "Có chính kiến, biết kiểm chứng và dám đặt câu hỏi. Tự tin với bản sắc của mình khi gặp những góc nhìn khác.", question: "Bạn tin vào điều gì — và vì sao?" },
  { name: "Khai mở tư duy toàn cầu", en: "PERSPECTIVE", text: "Lắng nghe ngoài trải nghiệm quen thuộc. Nhìn một vấn đề từ nhiều nền văn hoá và tìm điểm chung để cùng hợp tác.", question: "Một góc nhìn khác có thể thay đổi điều gì?" },
  { name: "Chủ động kiến tạo tương lai", en: "ACTION", text: "Bắt đầu từ một việc trong tầm tay: kể một câu chuyện, thử một ý tưởng, kết nối một người bạn để tạo thay đổi quanh mình.", question: "Sau hôm nay, bạn sẽ bắt đầu việc gì?" },
];

export default function GlobalMindSection() {
  return <section className="global-mind section-pad" id="tu-duy-toan-cau" aria-labelledby="global-mind-title">
    <div className="global-mind-intro">
      <div data-reveal>
        <span className="eyebrow">TINH THẦN GLOBAL CITIZENS DAY 2026</span>
        <h2 id="global-mind-title">Từ hiểu mình,<br /><em>đến hiểu thế giới.</em></h2>
        <p>Công dân toàn cầu bắt đầu từ cách ta nghĩ, cách ta lắng nghe và trách nhiệm với những điều mình làm. Cội nguồn là điểm tựa cho hành trình ấy.</p>
      </div>
      <div className="global-orbit" data-reveal data-reveal-delay="100">
        <svg viewBox="0 0 420 340" fill="none" aria-hidden="true">
          <circle cx="210" cy="165" r="119" /><ellipse cx="210" cy="165" rx="60" ry="119" /><ellipse cx="210" cy="165" rx="119" ry="45" />
          <path d="M91 165h238M210 46v238M107 105h206M107 225h206" />
          <ellipse className="global-orbit-ring" cx="210" cy="165" rx="190" ry="65" transform="rotate(-28 210 165)" />
          <path className="global-connection" d="M255 145Q330 30 370 72M255 145Q150 25 65 90M255 145Q180 290 77 269" />
          <circle className="global-origin" cx="255" cy="145" r="7" /><circle cx="370" cy="72" r="4" /><circle cx="65" cy="90" r="4" /><circle cx="77" cy="269" r="4" />
        </svg>
        <span className="global-orbit-label">VIETNAM ROOTS<br /><strong>GLOBAL MIND</strong></span>
        <span className="global-orbit-note">BẢN SẮC LÀ ĐIỂM TỰA. KẾT NỐI LÀ KHỞI ĐẦU.</span>
      </div>
    </div>
    <ol className="global-pillars">
      {pillars.map((pillar, index) => <li key={pillar.en} data-reveal data-reveal-delay={index * 60}>
        <div className="global-pillar-index"><span>0{index + 1}</span><span>{pillar.en}</span></div>
        <h3>{pillar.name}</h3><p>{pillar.text}</p><div className="global-pillar-question">{pillar.question}</div>
      </li>)}
    </ol>
    <a className="global-next" href="#hoi-cho">Khám phá ba trải nghiệm để bắt đầu <span aria-hidden="true">↘</span></a>
  </section>;
}
