const schedule = [
  { time: "06:15 – 07:15", title: "Di chuyển và chuẩn bị đón khách", note: "Theo phương án địa điểm." },
  { time: "07:30 – 08:00", title: "Check-in" },
  { time: "08:00 – 08:20", title: "Khai mạc" },
  { time: "08:20 – 10:30", title: "FORUM: Hack The Cultural Edge", featured: true },
  { time: "10:30 – 12:00", title: "Không gian di sản" },
  { time: "12:00 – 13:30", title: "Nghỉ trưa" },
  { time: "13:30 – 13:40", title: "Văn nghệ di sản 2" },
  { time: "13:40 – 14:50", title: "Chung kết Public Speaking “The Heritage Voices 2026”", featured: true },
  { time: "14:10 – 14:40", title: "Chuẩn bị Debating", parallel: true, note: "Tại khu vực riêng, không sử dụng sân khấu Public Speaking. Lịch phụ thuộc thể lệ được duyệt." },
  { time: "14:50 – 15:05", title: "Văn nghệ di sản 3 + bình chọn khán giả" },
  { time: "15:05 – 15:50", title: "Phần thi Debating", featured: true },
  { time: "15:50 – 16:15", title: "Heritage Talk + bốc thăm Hộ chiếu", featured: true },
  { time: "16:15 – 16:45", title: "Trao giải Public Speaking & Debating" },
  { time: "16:45 – 17:00", title: "Bế mạc" },
];

export default function EventSchedule() {
  return <section className="event-schedule section-pad" id="lich-trinh" aria-labelledby="schedule-title">
    <div className="event-section-heading" data-reveal><span className="eyebrow">LỊCH TRÌNH SỰ KIỆN / THE DAY AHEAD</span><h2 id="schedule-title">Một ngày gặp gỡ.<br /><em>Ngàn ý tưởng vươn xa.</em></h2><p>Từ câu chuyện cội nguồn đến những cuộc đối thoại mở — cùng tìm điểm hẹn của bạn tại Global Citizens Day 2026.</p><a href="#khach-moi" className="text-link">Gặp những người truyền cảm hứng <span aria-hidden="true">↘</span></a></div>
    <div className="event-agenda"><div className="event-agenda-top" data-reveal><span>GLOBAL CITIZENS DAY 2026</span><span>06:15 — 17:00</span></div><ol>{schedule.map((item, index) => <li key={item.time} className={`${item.featured ? "agenda-featured" : ""} ${item.parallel ? "agenda-parallel" : ""}`} data-reveal data-reveal-delay={index % 3 * 45}><span className="agenda-time">{item.time}</span><div>{item.parallel && <span className="agenda-badge">HOẠT ĐỘNG SONG SONG · KHU VỰC RIÊNG</span>}<h3>{item.title}</h3>{item.note && <p>{item.note}</p>}</div><span className="agenda-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></li>)}</ol><p className="agenda-footnote">Lịch trình dự kiến có thể được điều chỉnh theo phương án tổ chức thực tế.</p></div>
  </section>;
}
