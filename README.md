# Một Dải Di Sản

Landing page sự kiện văn hoá Việt Nam, xây dựng trên Next.js 16, React 19, Three.js và React Three Fiber.

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

- Hero toàn màn hình với tranh phong cảnh di sản tràn viền, chữ nổi trên nền và thanh điều hướng trong suốt khi ở đầu trang.
- Chim bay/vỗ cánh, mây trôi nhiều lớp, thuyền buồm trôi và nhấp nhô, ánh nước chuyển động lặp. Nút tạm dừng; tự dừng khi hero ra khỏi màn hình, tab bị ẩn hoặc bật giảm chuyển động.
- Collage di sản trên nền giấy, typography tiếng Việt, minh hoạ riêng cho từng chương trình.
- Con đường nối hội chợ văn hoá, cuộc thi tranh biện sinh viên và workshop · talkshow.
- Hiệu ứng mở đầu, parallax, float-in theo từng thành phần khi cuộn đến, tiến trình và điều hướng theo điểm dừng. Float-in chỉ chạy một lần, có độ trễ nhẹ giữa các phần tử và tắt khi bật chế độ giảm chuyển động.
- Ba mô hình 3D cách điệu: Chùa Một Cột, Tháp Rùa, Ngọ Môn. Kéo để xoay, chọn mô hình, tự xoay/tạm dừng, nút xoay bằng bàn phím và đặt lại góc nhìn.
- Chỉ tải Three.js khi gần đến vùng 3D; ngừng tự xoay khi ngoài màn hình hoặc tab bị ẩn; giới hạn độ phân giải canvas.
- Responsive, hỗ trợ giảm chuyển động và nội dung thay thế nếu WebGL không khả dụng.
- Hộ chiếu văn hoá: chọn trạm, lưu vào localStorage và tải lịch trình dạng `.txt`.

## Nội dung cần chốt trước khi công bố

Ngày, địa điểm, thể lệ tranh biện và lịch từng hoạt động chưa được cung cấp nên đang hiển thị là chờ công bố/dự kiến. Nghệ sĩ Xuân Bắc chỉ xuất hiện dưới dạng khách mời đề xuất, chưa xác nhận.

Chức năng lưu hành trình là tiện ích cá nhân trên thiết bị, **không gửi dữ liệu tới ban tổ chức và không phải đăng ký tham dự**. Khi có thông tin chính thức, thay CTA bằng đường dẫn đăng ký hoặc kết nối API phù hợp.

Mô hình được dựng bằng hình học thủ tục, là phiên bản nghệ thuật lấy cảm hứng từ công trình thật, không phải bản quét hoặc phục dựng chính xác.

## Cấu trúc

- `app/components/heritage-journey.tsx`: nội dung, điều hướng, reveal và hộ chiếu.
- `app/components/hero-section.tsx`, `app/hero.css`: hero toàn cảnh và các lớp chuyển động độc lập.
- `app/components/heritage-viewer.tsx`: mô hình và tương tác Three.js.
- `app/components/ornaments.tsx`: hoa sen, lồng đèn và họa tiết.
- `app/globals.css`: thiết kế, chuyển động, responsive.
- `app/layout.tsx`: font và metadata.
- `public/images/`: ảnh collage gốc và WebP tối ưu.
- `docs/art-direction.md`: định hướng và prompt ảnh tạo bằng image_gen.

## Kiểm tra trình duyệt

```bash
pnpm build
pnpm test:e2e
```

Playwright chạy Chrome đã cài, khởi động bản production ở cổng 3100 và kiểm tra: điều hướng, dialog/focus, lưu và tải lịch trình, mobile không tràn ngang, chuyển mô hình 3D, reduced motion và fallback khi WebGL bị tắt.

Ảnh QA xuất vào `test-results/` (không commit). Nếu máy chưa có Google Chrome, cài Chrome hoặc chỉnh `channel` trong `playwright.config.ts` sang trình duyệt Chromium có sẵn.

Đọc hướng dẫn Next.js đi kèm tại `node_modules/next/dist/docs/` trước khi sửa API hoặc cấu trúc framework.
