# Phí gian thương mại và chuyển khoản

## Nội dung chuyển khoản hiện tại

Định dạng: `JCITL GCD <mã gian> <tên đơn vị>`, ví dụ `JCITL GCD TM01 GOM VIET`. Tên lấy từ ô **Thương hiệu / đơn vị**, chuẩn hóa thành chữ hoa không dấu, bỏ ký tự đặc biệt. Nội dung rút gọn tối đa 50 ký tự để phù hợp VietQR. Chưa nhập tên thì chưa tạo QR; sửa tên sẽ tạo lại QR. Nội dung này được dùng thống nhất trong QR hiển thị, ảnh tải về và dữ liệu thanh toán của hồ sơ mới. Cú pháp có mã phiên ở các mô tả cũ bên dưới không còn áp dụng cho hồ sơ mới.

## Giới hạn lượt dùng (V8)

Admin có thể nhập số lượt tối đa khi tạo voucher; để trống là không giới hạn. Hiển thị số đã dùng và số lượt còn lại. Một lượt được tính khi hồ sơ gửi thành công, không tính lúc xem QR; gửi lại cùng phiên không trừ lần hai. Database khóa hàng voucher khi kiểm tra và trừ lượt để tránh dùng quá số lượng. Hồ sơ bị từ chối không tự hoàn lượt. Mã hết lượt hoặc không hợp lệ bị bỏ khi xác nhận, QR trở về giá gốc. Chạy migration V8 trước khi triển khai.

Khối QR có nút lưu PNG về thiết bị thông qua endpoint server tải ảnh VietQR; không phụ thuộc thuộc tính download trên ảnh khác miền. Nếu mã hết lượt trước lúc tải, cần xác nhận lại voucher.

## Voucher từ database (V7)

Mã giảm giá hiện được quản lý trong bảng `booth_vouchers`, không đọc `BOOTH_DISCOUNTS` từ env nữa. Chạy `pnpm db:migrate`, đăng nhập quản trị rồi mở `/booths`: phần quản lý voucher nằm đầu trang, cho phép thêm mã giảm phần trăm/số tiền và bật/tắt. Không cần khởi động lại ứng dụng khi thay đổi mã. Mã được chuẩn hoá thành chữ hoa và không được trùng; API quản trị kiểm tra tài khoản đang có quyền và Origin. Bảng bật RLS, không cấp quyền trực tiếp cho người dùng công khai hoặc tài khoản Auth thông thường.

Các cấu hình `BOOTH_BANK_ID`, `BOOTH_BANK_ACCOUNT`, `BOOTH_BANK_NAME` vẫn nằm trong env. Ví dụ `BOOTH_DISCOUNTS` phía dưới là cấu hình cũ V6 và không còn hiệu lực; các mã cũ cần nhập lại bằng giao diện admin. Voucher hiện không có giới hạn lượt sử dụng hoặc thời hạn tự động.

Giá gốc là 5.000.000đ/gian TM. Điền cấu hình server trong `.env`, rồi khởi động lại ứng dụng:

```dotenv
BOOTH_BANK_ID=970436
BOOTH_BANK_ACCOUNT=YOUR_ACCOUNT_NUMBER
BOOTH_BANK_NAME=TEN CHU TAI KHOAN KHONG DAU
BOOTH_DISCOUNTS='[{"code":"SAVE10","type":"percent","value":10},{"code":"SAVE500K","type":"amount","value":500000}]'
```

Các giá trị trên chỉ là mẫu, cần thay bằng tài khoản BTC. Không thêm tiền tố NEXT_PUBLIC cho danh sách mã. Giá trị `percent` là số nguyên 1–100; `amount` là số đồng nguyên dương. Số tiền tối thiểu sau giảm là 0đ. Không có cấu hình tài khoản thì không hiển thị QR. Mã không có trong cấu hình bị từ chối; không tự tạo mã hợp lệ cho người dùng.

QR theo VietQR Quick Link. Nội dung: `GCD TMxx XXXXXXXXXXXX`, hậu tố lấy từ 12 ký tự đầu UUID phiên gửi, lưu cùng hồ sơ để tra soát. Ngân hàng, tài khoản, số tiền và nội dung được gửi tới dịch vụ ảnh VietQR khi tải QR; không gửi thông tin liên hệ hoặc ảnh chuyển khoản. Tạo QR chưa tạo hồ sơ: khách vẫn cần gửi form và lưu mã hồ sơ.

Áp dụng migration V6 trước khi triển khai. `payment` lưu giá gốc, mức giảm, mã, số tiền, nội dung và đường dẫn ảnh biên nhận. Ảnh riêng tư trong Storage; admin nhận URL có hạn. Không tự xác nhận thanh toán từ QR hoặc ảnh, không webhook ngân hàng. Nếu admin chuyển gian cần đối soát theo thông tin thanh toán gốc.

Ảnh biên nhận không bắt buộc, tối đa 1 MB, JPEG/PNG/WebP. Độc lập với ba ảnh giới thiệu. Mã giảm giá không giới hạn lượt dùng và không có thời hạn tự động; BTC quản lý bằng cấu hình env.
