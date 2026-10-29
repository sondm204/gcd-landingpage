# Design system — Global Citizens Day 2026

## Nhận diện hiện tại

Thiết kế theo key visual **The Heritage Odyssey** trong `public/keyvisual/`. Chủ đề **Vietnam Roots – Global Minds** kết nối di sản Việt Nam với tư duy công dân toàn cầu. Ngôn ngữ thị giác: địa cầu xanh, dải lụa vàng, ánh bình minh và các đường nét kiến trúc Việt Nam.

Thông tin dùng chung tại `lib/event.ts`: **Chủ nhật, 29/11/2026**, **Học viện Thanh thiếu niên Việt Nam**, **Số 3 Chùa Láng, Phường Láng, Hà Nội**, lấy từ poster `3.png`. Khi đổi thông tin, cập nhật cả cấu hình và poster dùng cho link preview.

## Màu sắc

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--paper` | `#f7faff` | Nền trắng xanh |
| `--surface` | `#ffffff` | Thẻ, form, nền logo |
| `--ink`, `--navy` | `#08275c` | Chữ chính, nhận diện |
| `--royal` | `#125ac4` | CTA, liên kết, trạng thái đang chọn |
| `--sky` | `#eaf3ff` | Nền phụ, thẻ thông tin |
| `--gold` | `#c18b2a` | Viền, điểm dừng, trang trí |
| `--gold-light` | `#ffe2a0` | Chữ và họa tiết trên nền tối |
| `--heritage-red` | `#9d1519` | Năm 2026 và Vietnam Roots ở hero |
| `--muted` | `#596b88` | Nội dung phụ |
| `--line` | `#cbd9ec` | Viền và phân cách |

`--red` là tên token kế thừa, hiện trỏ tới xanh royal để giữ tương thích. Không dùng token này cho lỗi và thao tác nguy hiểm; các trạng thái này giữ màu đỏ riêng. Màu gốc của logo, ảnh khách mời và hiện vật 3D được giữ nguyên.

## Typography

- **Playfair Display** (`--font-display`): tiêu đề serif theo tinh thần poster, chữ nghiêng ở câu dẫn; kích thước co giãn bằng `clamp()`.
- **Be Vietnam Pro** (`--font-body`): nội dung, form, điều hướng và lịch trình; ưu tiên dễ đọc và khoảng cách dòng thoáng.
- Cả hai hỗ trợ tiếng Việt, dùng `next/font/google` trong `app/layout.tsx`, được phục vụ từ ứng dụng sau build.
- Wordmark **The Heritage Odyssey** dùng artwork gốc. Tiêu đề, slogan, ngày và địa điểm vẫn là HTML có thể đọc/chọn.

## Hình ảnh

| Tài sản | Vai trò |
| --- | --- |
| `public/keyvisual/1.png` | Hero toàn màn hình, nền lời mời và banner gian hàng |
| `public/keyvisual/3.png` | Poster đầy đủ, ảnh Open Graph/Twitter 1200×630 |
| `public/keyvisual/4.png` | Wordmark, lấy vùng chữ bằng SVG viewBox trong `heritage-lockup.tsx` |
| `public/images/intro-cloud.webp` | Mây tan khi vào trang |
| `public/images/logo_*.png` | Logo chương trình trên nền trắng |
| `public/images/ns_xuanbac.png`, `km_hoangthuylinh.png` | Khách mời |
| `public/images/sponsors/` | Logo và media nhà tài trợ |

Wordmark dùng `mix-blend-mode: multiply` để hòa nền trắng vào artwork. Không tạo stacking context ở `.hero-copy`, nếu không nền trắng sẽ xuất hiện trở lại. Giữ nguyên ảnh gốc trong `keyvisual/`.

## Các khu vực

- **Hero:** cao đúng `100dvh` theo vùng hiển thị hiện tại của thiết bị (fallback `100vh`), không đặt chiều cao tối thiểu cố định. Chữ, wordmark và khoảng cách co giãn theo cả chiều rộng và chiều cao; dành khoảng riêng cho header và gợi ý cuộn. Điện thoại xoay ngang dùng bố cục hai cột. Khung nội dung có thể cuộn khi người dùng tăng cỡ chữ lớn hoặc màn hình quá nhỏ. Nền tràn khung, chữ navy và wordmark vàng ở trái/giữa, địa cầu ở phải; mobile có lớp phủ sáng để dễ đọc.
- **Hành trình:** nền sáng, đường nối xanh–vàng, số trạm navy, minh họa CSS/SVG cùng bảng màu. Giữ cấu trúc kể chuyện và điều hướng khi cuộn.
- **Di sản 3D:** nền navy đậm, chữ sáng, nút chọn vàng/xanh. Sketchfab giữ xoay, zoom và thông tin tác giả.
- **Timeline:** nền xanh nhạt, đường dọc mảnh, mốc vàng; chương trình nổi bật có chấm xanh và chữ đậm. Hoạt động song song có nền riêng.
- **Khách mời:** sân khấu dùng chung xanh–vàng; chỉ chân dung luân chuyển, người phía sau xám. Nút trước/sau dưới mô tả; tự chuyển 10 giây khi hiển thị.
- **Nhà tài trợ:** thẻ logo trắng, xám khi bình thường, màu gốc khi hover/focus; media trên nền navy. Giữ slideshow và điều khiển thủ công.
- **Lời mời/footer:** lặp artwork để khép hành trình; footer navy, chữ vàng nhạt, logo trên nền trắng. Hộ chiếu là lịch trình cá nhân trên thiết bị, không phải vé tham dự.
- **`/booths` và quản trị:** banner cùng artwork; thẻ trắng, viền xanh nhạt, góc bo 5–14px. Bản đồ: trống trắng, có đề xuất vàng, đã chốt navy, đang chọn xanh royal. Trạng thái có nhãn, không chỉ dựa vào màu. Form, popup tài khoản, đăng nhập và dialog duyệt cùng bảng màu.

## Chuyển động và responsive

Giữ mây mở đầu, float-in khi cuộn, ticker, carousel và hover. Hero có quỹ đạo ánh sáng và điểm sáng chuyển động nhẹ theo địa cầu. Ambient dừng khi hero ngoài màn hình hoặc tab bị ẩn; `prefers-reduced-motion` tắt animation trang trí. Nhiều cột chuyển sang luồng dọc trên điện thoại. Giữ focus bàn phím rõ và nội dung đọc được khi giảm chuyển động.

## Nguồn triển khai

- `app/globals.css`: tokens, layout và tương tác nền tảng.
- `app/keyvisual.css`: nhận diện chung cho các section.
- `app/hero.css`: hero, mây và hiệu ứng địa cầu.
- `app/global-mind.css`, `app/event-program.css`, `app/sponsors.css`: layout từng section.
- `app/booths/booths.css`, `app/booths/booths-keyvisual.css`: đặt gian hàng và quản trị.
- `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `lib/site-metadata.ts`: link preview.

Định hướng cũ lưu như lịch sử tại `docs/art-direction.md`; tài liệu này và key visual hiện tại được ưu tiên khi có mâu thuẫn.
