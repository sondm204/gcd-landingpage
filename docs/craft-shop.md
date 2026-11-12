# Tiệm Bách nghệ — bản chơi thử

- `/game/craft-shop`: online; `/game/craft-shop?mode=event`: tại sự kiện.
- Truy cập từ hộp giới thiệu chặng 1 trong `/game`.
- Chưa kết nối đăng nhập, lưu điểm, cấp dấu thật hoặc xác nhận nhận quà.

## Luật

Theo `GameDesign.md`: online có 5 đơn trong 60 giây, đúng ít nhất 4 đơn để vượt chặng; giao đúng liên tiếp tăng combo và giao sai mất combo. Bản sự kiện có 3 đơn.

Các lựa chọn tạm thời cần BTC duyệt: mỗi khách online chờ 12 giây; sai/hết chờ tiêu thụ một đơn; điểm một đơn đúng là `20 + 10 × (combo − 1)`, tối đa 60 điểm/đơn (lượt online hoàn hảo đạt 200 điểm). Bản sự kiện thử nghiệm yêu cầu đúng cả 3 đơn, không áp đồng hồ do tài liệu chưa quy định. Bộ 5 sản phẩm là nội dung thử nghiệm.

Đồng hồ online dựa trên mốc thời gian kết thúc, tiếp tục chạy khi chuyển tab và trong phần phản hồi. Giao hàng tại/sau thời điểm hết giờ không được ghi điểm. Chơi lại tạo thứ tự đơn ngẫu nhiên mới; mỗi lượt không lặp sản phẩm.

## Nội dung làng nghề

- Gốm Bát Tràng, lụa Vạn Phúc, quạt Chàng Sơn và nón làng Chuông: [Cục Du lịch Quốc gia Việt Nam](https://vietnamtourism.gov.vn/en/printer/20688?type=1).
- Mây tre đan Phú Vinh: [Kế hoạch trưng bày của Bộ Văn hóa, Thể thao và Du lịch](https://bvhttdl.mediacdn.vn/document/2021/11/2/kh2822-1635842252988.pdf).

Minh họa SVG mang tính biểu trưng, không phải tư liệu hiện vật.

## Mã nguồn và kiểm tra

`app/game/craft-shop/engine.ts` chứa bộ sản phẩm, cấu hình và reducer độc lập với giao diện; `shop.tsx` quản lý đồng hồ, thao tác và kết quả; `shop.css` dùng class có tiền tố riêng theo cấu hình Turbopack hiện tại.

Chạy kiểm tra luật bằng `node --experimental-strip-types --test scripts/craft-shop.test.mjs`. Sau production build, chạy `node node_modules/@playwright/test/cli.js test tests/craft-shop.spec.ts` để kiểm tra thao tác mobile, điều hướng từ sảnh, kết quả, chơi lại và hết giờ.
