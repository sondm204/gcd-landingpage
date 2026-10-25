# Chùa Một Cột — Sketchfab

`app/components/sketchfab-viewer.tsx` là viewer dùng chung cho ba mô hình. Metadata được khai báo trong `heritage-viewer.tsx`; khi chuyển tab, viewer được khởi tạo lại theo ID, camera và nguồn tác giả của mô hình mới.

| Di sản | Model ID | Tác giả |
| --- | --- | --- |
| Chùa Một Cột | `9b2562f8884141c0b1777e1a1c05887c` | inucaboo |
| Tháp Rùa | `a22adcd051914e2e911debf0730cab28` | minhduc26119931 |
| Ngọ Môn | `4a1866001d034611a47b9116695da1d2` | Đào Minh Đức |
| Nhà hát Thành phố | `4267a8d941414589bc49f899c9c9d61f` | Theo thông tin trong iframe |
| Chùa Cầu | `59d89d40238c445f8316364b5fa45acd` | Theo thông tin trong iframe |
| Khuê Văn Các | `e448a20cb453475ab52b7a6486eae671` | kien249 |
| Lăng Tự Đức | `978f8e7afd9a4aebb738339c9f0087a0` | Theo thông tin trong iframe |
| Nhà thờ Chính toà | `b02a72b4468b4cceb1db4f2cc394d182` | Theo thông tin trong iframe |
| Trống đồng Đông Sơn | `7e38e31e0ac64f43a2035aecfc32f6b2` | Theo thông tin trong iframe |
| Nón lá | `08338678a712414fbdbf392e6d8ce53e` | Theo thông tin trong iframe |
| Bia tiến sĩ | `7aac2b6d65764a519fdbc71ceb03227f` | Theo thông tin trong iframe |

Bộ chọn hiển thị 3 cột trên desktop, 2 cột trên mobile, đánh số 01–11. Chỉ mô hình đang chọn được tải vào iframe. Khuê Văn Các dùng URL đích người dùng gửi (`e448a20…`), không dùng ID khác trong nhãn liên kết.

- `transparent=1`: yêu cầu nền trong suốt, phụ thuộc quyền Pro trở lên của Sketchfab. Không thể xoá sàn hoặc cảnh quan đã nằm trong geometry chỉ bằng tham số này.
- `navigation=orbit`, `scrollwheel=1`: cho phép kéo xoay, con lăn và thao tác cảm ứng của viewer.
- `autospin=0`, `animation_autoplay=0`, `camera=0`: tránh chuyển động tự động, bỏ hoạt ảnh camera mở đầu.
- Viewer API: `recenterCamera`, `getCameraLookAt`, `setCameraLookAt` phục vụ căn khung, zoom, xoay và reset. Nút zoom riêng giới hạn khoảng cách 0.35–2.5 lần camera ban đầu; thao tác zoom gốc vẫn tuân theo thiết lập của mô hình.
- Iframe giữ giao diện và thông tin tác giả gốc của Sketchfab. Đã bỏ dòng ghi nguồn lặp bên dưới iframe. SDK không khả dụng thì nút camera riêng bị vô hiệu; iframe trực tiếp vẫn có thể dùng giao diện gốc. Khi tải thất bại, có liên kết mở mô hình trực tiếp.
- `autostart=1` cùng `api.start()` khi API/iframe sẵn sàng tự khởi chạy viewer. Không gọi `stop()` khi cuộn ra ngoài vùng nhìn vì thao tác này đưa viewer trở lại màn hình Play; chỉ dừng khi viewer bị tháo khỏi trang hoặc chuyển tab mô hình.
- Khung cao 340–440px trên desktop, 300–360px trên mobile; stylesheet được import trực tiếp cùng component để tương thích loader CSS của dự án. Camera ban đầu tiến gần 18% sau khi căn khung; nút reset cũng trở về góc nhìn lớn này. Nút toàn màn hình dùng Fullscreen API, có thêm nút gốc trong Sketchfab.

Không đặt iframe vào trong `Canvas`: iframe là DOM và được render thay cho toàn bộ khung Three.js ở tab này.

Tài liệu: [Tham số khởi tạo](https://sketchfab.com/developers/viewer/initialization), [API camera](https://sketchfab.com/developers/viewer/functions).
