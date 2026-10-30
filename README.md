# Global Citizens Day 2026 — The Heritage Odyssey

Landing page sự kiện với thông điệp **Vietnam Roots – Global Minds**, xây dựng trên Next.js 16 và React 19. Nhận diện theo `public/keyvisual/`, chi tiết tại [design.md](design.md).

## Chạy dự án

Khu vực đặt vị trí gian hàng: **`/booths`**, quản trị **`/booths/admin`**. Xem [hướng dẫn Supabase, Flyway và tạo admin](docs/booths.md). Các file mẫu cấu hình: `.env.example`, `.env.flyway.example`.

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`.

```bash
pnpm build
pnpm start
```

Font được tải về lúc build bởi `next/font/google`, sau đó phục vụ từ chính ứng dụng.

## Trải nghiệm

- Hero toàn màn hình với địa cầu và dải di sản xanh–vàng, tiêu đề HTML và wordmark gốc của sự kiện.
- Mây tan mở đầu, quỹ đạo ánh sáng và điểm sáng chuyển động nhẹ; ambient tự dừng khi hero ra khỏi màn hình, tab bị ẩn hoặc bật giảm chuyển động.
- Typography Playfair Display và Be Vietnam Pro, minh họa riêng cho từng chương trình.
- Con đường nối hội chợ văn hoá, cuộc thi tranh biện sinh viên và workshop · talkshow.
- Hiệu ứng mở đầu, parallax, float-in theo từng thành phần khi cuộn đến, tiến trình và điều hướng theo điểm dừng. Float-in chỉ chạy một lần, có độ trễ nhẹ giữa các phần tử và tắt khi bật chế độ giảm chuyển động.
- Thư viện 11 mô hình Sketchfab, chọn hiện vật, kéo để xoay và zoom.
- Timeline, carousel khách mời, nhà tài trợ và khu vực đặt/duyệt gian hàng cùng nhận diện.
- Responsive và hỗ trợ giảm chuyển động.
- Hộ chiếu văn hoá: chọn trạm, lưu vào localStorage và tải lịch trình dạng `.txt`.

## Nội dung cần chốt trước khi công bố

Ngày và địa điểm lấy từ poster: **29/11/2026 — Học viện Thanh thiếu niên Việt Nam, Số 3 Chùa Láng, Phường Láng, Hà Nội**. Cấu hình tại `lib/event.ts`. Lịch hoạt động vẫn có ghi chú dự kiến; thể lệ và hình thức đăng ký tham dự được cập nhật khi ban tổ chức chốt.

Chức năng lưu hành trình là tiện ích cá nhân trên thiết bị, **không gửi dữ liệu tới ban tổ chức và không phải đăng ký tham dự**. Khi có thông tin chính thức, thay CTA bằng đường dẫn đăng ký hoặc kết nối API phù hợp.

Mô hình được nhúng từ Sketchfab với liên kết ghi nhận tác giả.

## Cấu trúc

- `app/components/heritage-journey.tsx`: nội dung, điều hướng, reveal và hộ chiếu.
- `app/components/hero-section.tsx`, `app/hero.css`: hero toàn cảnh và các lớp chuyển động độc lập.
- `app/components/heritage-viewer.tsx`, `sketchfab-viewer.tsx`: danh sách mô hình và trình xem Sketchfab.
- `app/components/ornaments.tsx`: hoa sen, lồng đèn và họa tiết.
- `app/globals.css`, `app/keyvisual.css`: tokens, thiết kế chung, chuyển động và responsive.
- `app/layout.tsx`: font và metadata.
- `public/keyvisual/`: artwork nhận diện; `public/images/`: logo, khách mời, nhà tài trợ và các tài sản phụ trợ.
- `docs/art-direction.md`: định hướng và prompt ảnh tạo bằng image_gen.

## Kiểm tra trình duyệt

```bash
pnpm build
pnpm test:booths:app
```

Kiểm thử gian hàng dùng Chrome và Supabase giả lập cục bộ: gửi đề xuất, upload, đăng nhập, duyệt, chỉnh sửa/đổi vị trí, đăng xuất và responsive. Không ghi dữ liệu vào Supabase thật.

Khi đổi nhận diện trang chủ, kiểm tra thêm ở 320–1440px: hero/wordmark, mây mở đầu, điều hướng mobile, dialog lưu hành trình, carousel khách mời 10 giây và nút chuyển thủ công, nhà tài trợ, mô hình 3D, footer và hai ảnh preview. Bộ `tests/journey.spec.ts` còn các kịch bản của hero/3D phiên bản cũ; cần cập nhật các kịch bản đó trước khi dùng `pnpm test:e2e` làm điều kiện phát hành.

Ảnh QA xuất vào `test-results/` (không commit). Nếu máy chưa có Google Chrome, cài Chrome hoặc chỉnh `channel` trong `playwright.config.ts` sang trình duyệt Chromium có sẵn.

Đọc hướng dẫn Next.js đi kèm tại `node_modules/next/dist/docs/` trước khi sửa API hoặc cấu trúc framework.
## Link preview khi chia sẻ

Open Graph và Twitter Card dùng ảnh 1200×630 từ poster `public/keyvisual/3.png`. Cấu hình `SITE_URL=https://gcd-landingpage.vercel.app` trong environment của hosting; khi đổi tên miền, đổi biến này rồi build/deploy lại. Nếu không đặt, app dùng domain production của Vercel hoặc domain hiện tại làm mặc định. `APP_ORIGIN` vẫn dùng riêng cho kiểm tra Origin của API.

Ảnh được tạo tại `/opengraph-image` và `/twitter-image`. Trang chủ và `/booths` có tiêu đề, mô tả, canonical riêng.
