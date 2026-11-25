# Design system — Global Citizens Day 2026

Hướng thiết kế: **Hành trình di sản đương đại**. Lấy artwork The Heritage Odyssey làm điểm nhớ, dùng đường hành trình và minh họa di sản để kết nối nội dung. Những khu vực người dùng nhập dữ liệu hoặc quản lý hồ sơ có bề mặt rõ, ít trang trí.

Phân tích toàn bộ nhóm giao diện, wireframe và lý do chọn thiết kế nằm tại [docs/ui-ux-review.md](docs/ui-ux-review.md).

## Nhận diện và màu

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--paper` | `#F3F7FC` | Nền ứng dụng |
| `--surface` | `#FFFFFF` | Form, panel và nền logo |
| `--ink`, `--navy` | `#08275C` | Chữ chính, di sản 3D và footer |
| `--royal` | `#125AC4` | CTA, liên kết và lựa chọn |
| `--teal` | `#087E8B` | Giá trị văn hóa, hoạt động song song |
| `--gold` | `#C18B2A` | Dải lụa, mốc hành trình và trang trí |
| `--gold-light` | `#FFE2A0` | Chi tiết trên nền tối |
| `--muted` | `#526783` | Chữ phụ |
| `--line` | `#CBD9EC` | Phân cách, viền control |

`--red` là alias tương thích của xanh CTA. Lỗi, thao tác nguy hiểm, thanh toán và trạng thái nghiệp vụ tiếp tục có màu ngữ nghĩa riêng. Không thay màu bản đồ gian hàng hoặc nhận diện gốc của logo, chân dung và hiện vật.

## Typography và khoảng cách

- **Be Vietnam Pro** cho nội dung, điều hướng, label, form và dữ liệu. **Playfair Display** cho các tiêu đề di sản. Cả hai lưu tại `public/fonts/`, hỗ trợ tiếng Việt và không cần mạng khi build.
- Body 16px, control 14–16px, thông tin phụ 13px. Nhãn dùng sentence case; chữ hoa trong artwork và logo được giữ nguyên.
- Tiêu đề co giãn bằng `clamp()`, không đổi màu/nghiêng một nửa tiêu đề trên mọi section. Giới hạn mô tả khoảng 60–70 ký tự mỗi dòng.
- Lưới nội dung tối đa 1280px; gutter 20px mobile và 6vw desktop. Khoảng cách theo 4/8/12/16/24/32/48/64/96.
- Control bo 8px, panel 16px, sân khấu lớn 20–24px. Chỉ tag/trạng thái dùng pill. Không dùng chung một lớp shadow cho mọi thẻ.

## Cấu trúc trải nghiệm

- Header có CTA rõ “Đăng ký tham gia sự kiện”, VI/EN, trạng thái trang và menu mobile hỗ trợ Escape/focus.
- Hero cao `100dvh`, giữ artwork/video gốc, mây mở đầu và nội dung HTML cho trình đọc màn hình. Ngày, địa điểm và CTA luôn thuộc bố cục nội dung; màn hình thấp có thể cuộn vùng nội dung.
- Ngay sau hero là lối tắt đến ba chương trình và Hộ chiếu Di sản. Nội dung trải nghiệm đi trước phần giới thiệu tổ chức.
- Ba trạm giữ minh họa làng nghề, tranh biện và workshop; tuyến lụa là thiết bị kể chuyện chính. Các giá trị tư duy song song không có số thứ tự.
- Di sản 3D dùng nền navy, giữ đủ mô hình và điều khiển Sketchfab. Lịch trình dùng bề mặt trắng, ưu tiên giờ và hoạt động, phân biệt hoạt động song song bằng nhãn lẫn màu.
- Khách mời giữ carousel, ảnh và nội dung; nhà tài trợ giữ màu logo gốc thay vì chỉ hiện màu khi hover.
- Trang đăng ký đặt ngữ cảnh sự kiện cạnh form trên desktop và phía trên form trên mobile. Dùng dữ liệu chung trong `lib/event.ts`; không hardcode ngày/địa điểm vào component.
- Gian hàng giữ bản đồ, trạng thái, hồ sơ và thanh toán; hướng dẫn khu vực có thể mở rộng trên mobile để không đẩy bản đồ xuống quá xa.
- Lobby, tài khoản, hộ chiếu QR, bảng điểm và quản trị thừa hưởng thang chữ/control. Không đổi hình học canvas hoặc cơ chế của năm mini-game.
- Nút “Lưu hành trình” mở tiện ích chọn trạm, lưu trên thiết bị và tải `.txt`. Đây là lịch trình cá nhân, độc lập với form đăng ký tham dự.

## Tương tác và accessibility

Giữ video, mây, reveal và carousel hiện có. Giảm lớp ambient trang trí, tránh chuyển động nhảy thẻ khi hover. `prefers-reduced-motion` tắt chuyển động trang trí, cuộn mượt và transition không cần thiết. Điều khiển có focus rõ, vùng bấm chính từ 44–48px. Các vùng bảng/form dài có scrollbar để nhận biết khả năng cuộn.

## Triển khai và kiểm tra

- `app/globals.css`: nền tảng, hình học minh họa và tương tác.
- `app/keyvisual.css`: nhận diện kế thừa từ artwork.
- `app/ui-system.css`: token và quy tắc trình bày dùng chung, nạp sau các stylesheet nhận diện; selector giới hạn theo component để giữ hình học game/bản đồ.
- Các stylesheet riêng giữ cấu trúc, trạng thái và responsive của từng tính năng.
- `tests/journey.spec.ts`: hero ở 320–1440px và landscape, lối tắt, menu mobile, dialog/focus, lưu/tải lịch trình, selector 3D và reduced motion.
- `tests/i18n.spec.ts`, `tests/sketchfab.spec.ts` và các script kiểm thử ứng dụng xác minh ngôn ngữ, điều khiển mô hình và nghiệp vụ với transport giả lập.

Thông tin sự kiện hiện tại luôn lấy từ `lib/event.ts`. Artwork và tài liệu cũ có thể còn ngày/địa điểm khác; không lấy thông tin logistics bằng cách suy luận từ ảnh. Mọi thay đổi lịch sự kiện là công việc nội dung riêng.
