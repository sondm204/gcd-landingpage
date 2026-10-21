# Design system — Một Dải Di Sản

Tài liệu này ghi lại phong cách **đang được triển khai** cho landing page sự kiện di sản văn hoá Việt Nam. Mục tiêu là một hành trình biên tập mang chất nghệ thuật: giàu hình ảnh, ấm như giấy in, có nhịp kể chuyện và chuyển động nhẹ để dẫn người xem qua từng điểm dừng.

## Tinh thần thị giác

- Kết hợp mỹ thuật truyền thống Việt Nam với bố cục đương đại. Họa tiết sen, mặt trời, đèn lồng, mây và đường đi là điểm nhấn, không phủ kín nội dung.
- Chuyển cảnh theo nhịp **giấy sáng → cảnh quan toàn màn hình → các trạm di sản → không gian xanh đậm → giấy sáng**. Mỗi trạm có một minh họa riêng, nhưng cùng ngôn ngữ màu và chữ.
- Ưu tiên chất liệu giấy, hạt nhiễu rất nhẹ, viền mảnh, hình cắt ghép và khoảng trắng rộng. Tránh hiệu ứng bóng kính hoặc gradient công nghệ quá mạnh.
- Ảnh và mô hình 3D mang tính diễn giải nghệ thuật; không trình bày như bản phục dựng lịch sử chính xác.

## Màu sắc

| Token / màu | Giá trị | Cách dùng |
| --- | --- | --- |
| `--paper` | `#f3eddf` | Nền chính, lớp giấy, chữ trên nền tối |
| `--ink` | `#293e34` | Chữ và nét chính, xanh lá trầm |
| `--red` | `#aa382a` | CTA, chữ nhấn, dấu mốc hành trình |
| `--muted` | `#777568` | Chú thích, nội dung thứ cấp |
| `--line` | `#d5cebb` | Đường phân cách và viền mảnh |
| `--gold` | `#b4955e` | Chi tiết trang trí, sắc kim cổ |
| Xanh nền 3D | `#263e34` | Chuyển nhịp sang phần hiện vật |
| Vàng nhạt trên nền tối | `#d8bc80` | Điểm nhấn trong phần 3D |

Giữ độ tương phản rõ cho chữ và nút. Dùng đỏ làm điểm nhấn có chủ đích, không biến mọi thành phần thành CTA.

## Chữ và giọng văn

- **Playfair Display** (`--font-display`): tiêu đề lớn, câu dẫn và những chữ cần cảm giác biên tập. Trọng lượng mặc định `500`; có thể dùng chữ nghiêng màu đỏ để nhấn một cụm ngắn.
- **Be Vietnam Pro** (`--font-body`): đoạn văn, điều hướng, nút, nhãn và thông tin chương trình. Font được khai báo trong `app/layout.tsx` với hỗ trợ tiếng Việt.
- Tiêu đề hero lớn, căn giữa trên ảnh; desktop dùng `clamp(66px, 7.1vw, 112px)`, mobile dùng `clamp(37px, 11.3vw, 64px)`. Tiêu đề các phần khác co giãn theo khung nhìn thay vì dùng một cỡ cố định.
- Nhãn nhỏ (`.eyebrow`) cỡ `10px`, nét `600`, letter-spacing `2px`; hợp với số thứ tự, tên chặng và nhãn phụ. Văn bản dài dùng chiều cao dòng thoáng (`line-height: 1.9`).
- Câu chữ tiếng Việt nên ngắn, gợi hình nhưng rõ ý. Ngày, địa điểm và khách mời chưa xác nhận phải thể hiện là thông tin dự kiến, không viết như đã công bố.

## Bố cục và thành phần

- **Hero:** ảnh phong cảnh tràn toàn màn hình (`100svh`, tối thiểu `700px`), chữ nổi trên ảnh; lớp vignette tạo vùng đọc rõ. Header trong suốt khi nằm trên hero.
- **Lề nội dung:** `.section-pad` dùng `max(7.2vw, calc((100vw - 1400px) / 2))`. Giữ các khối nội dung rộng rãi, tránh dồn quá nhiều chữ trong một khung.
- **Con đường di sản:** các trạm chương trình sắp theo nhịp xen kẽ minh họa và nội dung; đường nối, số chặng và điểm điều hướng làm rõ hướng di chuyển khi cuộn.
- **Ba chương trình:** hội chợ gian hàng, tranh biện sinh viên và workshop/talkshow có artwork riêng theo cùng bảng màu. Minh họa trạm chủ yếu là CSS/SVG, với cảm giác collage thủ công.
- **Không gian 3D:** nền xanh đậm, chữ sáng và vàng nhạt. Ba mô hình cách điệu gồm Chùa Một Cột, Tháp Rùa và Ngọ Môn; khung xem là một điểm dừng trong hành trình, không lấn át phần thông tin.
- **Nút và viền:** nút chính nền đỏ, chữ kem `#fff8e8`, góc bo rất nhẹ (`2px`), hover nâng `3px` và đỏ đậm hơn. Điều hướng, thẻ và đường phân cách dùng viền mảnh. Luôn giữ trạng thái `focus-visible` rõ ràng.
- **Responsive:** các thay đổi chính nằm ở `1100px`, `800px`, `600px`, `370px`; riêng hero có thêm quy tắc cho màn hình rộng hoặc thấp. Trên mobile, ưu tiên đọc được tiêu đề, không che nội dung bằng họa tiết và chuyển các cột thành luồng dọc khi cần.

## Hình ảnh và chất liệu

| Tài sản | Vai trò |
| --- | --- |
| `public/images/heritage-panorama.webp` | Ảnh nền hero đang dùng |
| `public/images/intro-cloud.webp` | Đám mây có hình rõ trong màn mở đầu |
| `app/components/ornaments.tsx` | Hoa sen, mặt trời, đèn lồng SVG |
| `app/components/heritage-viewer.tsx` | Các mô hình di sản 3D cách điệu |

Lớp hạt nhiễu `body::after` rất nhẹ (`opacity: .045`) giúp toàn trang có chất giấy. Ảnh cần có điểm đặt chữ đủ thoáng; thêm lớp phủ đọc chữ khi thay ảnh hero. Giữ hình trang trí không cản thao tác và không thay thế nội dung văn bản.

## Chuyển động

- **Mở trang:** các cụm mây thật từ `intro-cloud.webp` phủ màn hình rồi tách và tan trong khoảng `3.6s`, để lộ hero. Đây là hoạt ảnh một lần.
- **Hero lặp:** mây trôi chậm (`95–150s`), chim bay (`37–49s`, có nhịp vỗ cánh), thuyền trôi (`24s`) và nhấp nhô nhẹ (`4.5s`). Chuyển động ambient phải đủ chậm để không tranh sự chú ý với tiêu đề.
- **Khi cuộn:** phần tử có `data-reveal` bắt đầu mờ, dịch xuống `38px`, thu nhỏ `0.985`; khi vào vùng nhìn sẽ float-in trong `800ms` với easing `cubic-bezier(.2,.7,.2,1)`. Có thể thêm `data-reveal-delay` để tạo nhịp lần lượt; hiệu ứng chỉ chạy một lần.
- **Nhịp phụ:** ticker chạy `55s`, mặt trời quay `100s`, đèn lồng đung đưa khoảng `6–7s`. Dùng chuyển động có ý nghĩa kể chuyện, tránh thêm nhiều vòng lặp nhanh.
- Khi hero rời màn hình hoặc tab ẩn, các chuyển động ambient được tạm dừng. Tôn trọng `prefers-reduced-motion`: bỏ hoặc rút ngắn hoạt ảnh, bảo đảm nội dung vẫn xuất hiện và dùng được.

## Khi mở rộng giao diện

1. Dùng lại token màu, hai font và lề nội dung trước khi tạo biến thể mới.
2. Đặt section mới vào nhịp kể của con đường; chọn một hình ảnh chủ đạo và một điểm nhấn chuyển động là đủ.
3. Áp dụng `data-reveal` cho các khối cần xuất hiện khi cuộn; kiểm tra cả mobile và chế độ giảm chuyển động.
4. Kiểm tra độ đọc của chữ trên ảnh, trạng thái bàn phím và hiệu năng của ảnh/3D.
5. Cập nhật tài liệu này khi thay đổi phong cách nền tảng.

Nguồn triển khai hiện tại: `app/globals.css`, `app/hero.css`, `app/layout.tsx` và `app/components/`. Lịch sử định hướng hình ảnh nằm trong `docs/art-direction.md`; nếu hai tài liệu khác nhau, mã nguồn và tài liệu này mô tả giao diện hiện hành.
