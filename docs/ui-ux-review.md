# Rà soát UI/UX và hướng thiết kế

## Sản phẩm và người dùng

Global Citizens Day 2026 kết nối di sản Việt với tư duy công dân toàn cầu. Ba nhóm công việc chính: người tham dự tìm chương trình và đăng ký; đơn vị gian hàng chọn vị trí, gửi hồ sơ và thanh toán; người chơi khám phá các chặng, tích dấu và theo dõi kết quả. Quản trị viên xử lý hồ sơ, xuất Excel và quản lý trò chơi/hộ chiếu.

## Đánh giá hiện trạng

| Phạm vi | Điểm tốt | Vấn đề cần xử lý |
| --- | --- | --- |
| Header, VI/EN | Có điều hướng, trạng thái trang, menu mobile | CTA “Hẹn một chuyến đi” chưa nói rõ đăng ký; logo và phụ đề nhiều chữ hoa, nhãn nhỏ |
| Hero | Artwork/video riêng, nhận diện đặc trưng, có ngày/địa điểm | Nội dung phụ nhỏ; nhiều chuyển động và điểm sáng cùng lúc; thiếu lối tắt đến chương trình |
| Nội dung, hành trình | Minh họa làng nghề, tranh biện, workshop riêng; có dialog chi tiết | Phần tổ chức dài đứng trước nội dung trải nghiệm; nhiều tiêu đề nghiêng/đổi màu giống nhau; mô tả và tag nhỏ |
| Tư duy toàn cầu | Nội dung có chiều sâu, hình địa cầu phù hợp | Đánh số các giá trị tạo cảm giác một quy trình dù chúng là các nguyên tắc song song |
| Di sản 3D | Chọn mô hình, ghi nhận tác giả, kéo/zoom | Điều khiển và chú thích nhỏ; cần focus tương phản với sân khấu tối |
| Lịch trình | Có giờ, nổi bật và hoạt động song song | Số thứ tự trang trí lặp thông tin thời gian; cột nội dung cần bề mặt rõ hơn |
| Khách mời, tài trợ, tổ chức | Có tư liệu thật, carousel điều khiển thủ công | Logo tài trợ bị làm xám; nhãn quá nhỏ; quá nhiều gradient và hiệu ứng hover |
| Đăng ký | Label, autocomplete, lỗi theo trường, trạng thái thành công | Form thiếu ngữ cảnh ngày/địa điểm; chưa tạo cảm giác thuộc cùng hành trình |
| Gian hàng, bản đồ, thanh toán | Trạng thái có nhãn, có hướng dẫn và kiểm tra hồ sơ | Nhiều chữ 9–13px; mobile ẩn toàn bộ hướng dẫn khu vực; cần khôi phục khả năng tham khảo |
| Lobby, tài khoản, hộ chiếu, bảng điểm | Chặng có minh họa và trạng thái, phân biệt online/trực tiếp | Mô tả và điều khiển lobby quá nhỏ; cần tăng nhịp chữ và vùng bấm |
| Năm mini-game | Bố cục và điều khiển riêng theo trò chơi | Giữ hình học canvas, thời gian, tính điểm và điều khiển; chỉ thừa hưởng focus/giảm chuyển động ở lớp dùng chung |
| Quản trị | Bộ lọc, phân trang, xuất Excel, quyền truy cập sẵn có | Bảng cuộn bị ẩn scrollbar toàn cục; các công cụ cần cùng quy chuẩn form và trạng thái |
| CSS, khả năng tiếp cận | Font Việt lưu cục bộ, có reduced motion và focus | Có nhiều lớp override cũ; ẩn scrollbar trên mọi phần tử làm khó nhận biết vùng cuộn |

Đánh giá dựa trên toàn bộ các nhóm route/component/style và ảnh chụp tự động của giao diện công khai. Các thao tác có ghi dữ liệu được xác minh bằng backend giả lập; không dùng dữ liệu hay tài khoản thật để kiểm thử.

## Design system: Hành trình di sản đương đại

| Màu nền tảng | Hex | Vai trò |
| --- | --- | --- |
| Xanh di sản | `#08275C` | Chữ, sân khấu di sản, footer |
| Xanh kết nối | `#125AC4` | CTA, liên kết, đang chọn |
| Xanh men | `#087E8B` | Chi tiết hành trình và giá trị văn hóa |
| Vàng lụa | `#C18B2A` | Tuyến hành trình, dấu ấn; không dùng làm chữ nhỏ trên trắng |
| Trắng xanh | `#F3F7FC` | Nền ứng dụng |
| Trắng | `#FFFFFF` | Nội dung, biểu mẫu, logo |

Màu ngữ nghĩa lỗi/thành công của các luồng nghiệp vụ được giữ riêng. `--red` là alias kế thừa của xanh CTA, không dùng cho lỗi. Chữ phụ dùng `#526783`; viền dùng `#CBD9EC`.

**Chữ:** Be Vietnam Pro cho nội dung, form và điều hướng; Playfair Display chỉ dành cho các tiêu đề di sản. Giữ font local và hỗ trợ dấu tiếng Việt. Nội dung 16px, điều khiển/nhãn 14px trở lên, thông tin phụ 13px. Tiêu đề dùng `clamp()`, ưu tiên cùng màu và chữ đứng. Dòng mô tả giới hạn khoảng 60–70 ký tự.

**Không gian:** lưới nội dung tối đa 1280px, gutter 20px mobile/6vw desktop; thang khoảng cách 4/8/12/16/24/32/48/64/96. Góc bo 8px điều khiển, 16px panel, 24px vùng sân khấu; pill chỉ dành cho tag/trạng thái. Bóng chỉ dùng ở lớp nổi (header, dialog), không áp dụng cho mọi thẻ.

### Bố cục được cân nhắc

Phương án A đặt toàn bộ nội dung trong lưới thẻ giống nhau. Dễ đồng bộ nhưng mất nhịp kể chuyện và không thể hiện được hành trình, nên không chọn.

```text
[ Hero ]
[ Card ][ Card ][ Card ]
[ Card ][ Card ][ Card ]
```

Phương án B giữ hero artwork làm điểm nhớ, nối ngay tới ba chương trình; các phần sau thay đổi bố cục theo nhiệm vụ. Chọn phương án này.

```text
[ Header: nhận diện | điều hướng | đăng ký | VI/EN ]
[ Artwork + lời mời + ngày/địa điểm + CTA           ]
[ Hội chợ | Tranh biện | Workshop | Hộ chiếu       ]
[ Giới thiệu ] [ Tinh thần / các giá trị          ]
[ Minh họa       / Chương trình                   ]
[ Chương trình   / Minh họa                       ]
[ Di sản 3D: nội dung | sân khấu tương tác         ]
[ Lịch trình: lời dẫn | thời gian và hoạt động     ]
[ Khách mời ] [ Tổ chức ] [ Tài trợ ] [ Đăng ký    ]
```

Nội dung và biểu mẫu canh trái; hero và lời hẹn cuối giữ bố cục theo artwork. Mobile xếp dọc; lối tắt hai cột; lịch trình ưu tiên giờ trước nội dung. Trang đăng ký có ngữ cảnh sự kiện bên trái, form bên phải; mobile đặt ngữ cảnh gọn phía trên form.

### Tự phản biện trước khi triển khai

- Xanh–vàng xuất phát từ artwork hiện có. Không đổi sang palette đang thịnh hành làm mất nhận diện.
- Tuyến lụa và minh họa làng nghề là điểm nhớ, vì vậy bỏ ý tưởng thêm gradient/animation trên mọi thẻ.
- Các giá trị tư duy không phải các bước: bỏ đánh số; trạm và quy trình đặt gian vẫn giữ số có ý nghĩa.
- Nội dung trải nghiệm xuất hiện trước phần giới thiệu tổ chức; giữ đầy đủ nội dung tổ chức ở phần tạo tin cậy sau khách mời.
- Dùng phản hồi hover/focus, không làm mọi card nhảy lên. Giữ chức năng carousel, mây, video và reveal; giảm độ mạnh của chuyển động và tôn trọng reduced motion.

## Giới hạn thay đổi

Chỉ đổi trình bày, thứ tự nội dung và điều hướng tới tính năng đã có. Không đổi API, validation, schema dữ liệu, xác thực, tính điểm, giới hạn lượt chơi, thanh toán, voucher, check-in hay quyền quản trị. Không đổi ngày/địa điểm lấy từ `lib/event.ts`. Không thêm dependency/font/ảnh bên ngoài.

## Triển khai

`app/ui-system.css` là hợp đồng trình bày dùng chung, nạp sau stylesheet nhận diện. Selector được giới hạn theo component để không ảnh hưởng canvas và hình học mini-game. Geometry của minh họa, keyvisual, bản đồ và từng trò chơi tiếp tục nằm ở các stylesheet chuyên biệt.

## Kết quả xác minh

- Production build thành công, bao gồm kiểm tra TypeScript.
- 17 kịch bản Playwright đạt: hero 320–1440px và landscape, menu/focus, lối tắt, dialog chi tiết, lưu/tải hành trình, carousel, reduced motion, VI/EN, hướng dẫn gian hàng mobile và điều khiển Sketchfab qua SDK giả lập.
- Các bộ `test:registrations:app`, `test:booths:app`, `test:admin:app` và `test:games:app` đạt với Supabase giả lập. Kiểm tra bao gồm retry/idempotency, xét duyệt, xuất Excel, tính điểm game, check-in và đổi quà.
- ESLint các component và bài test thay đổi đạt. Ảnh desktop/mobile được chụp từ production tại `test-results/ui-refresh/` để tự đánh giá bố cục.
- Bộ journey cũ đã được cập nhật cho hero video và CTA đăng ký hiện tại. Backend giả lập của bộ game được bổ sung `game_availability` để tương thích cổng mở/đóng game đang có; không thay cổng đó ở ứng dụng.

Các kiểm tra SDK dùng mô phỏng để không phụ thuộc dịch vụ 3D bên ngoài. Không ghi hồ sơ, thanh toán hay điểm chơi vào hệ thống thật.
