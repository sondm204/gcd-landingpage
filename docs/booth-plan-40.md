# Sơ đồ 40 vị trí

- TM01–TM24: 24 gian thương mại nhận đề xuất, áp dụng giá và voucher hiện hành.
- TT01–TT08: 8 vị trí tài trợ nhận đề xuất; TT07 là Backdrop Trống Đồng, TT08 là Camera 360°.
- VH01–VH05: 5 điểm hỗ trợ văn hoá đã bố trí, không nhận đăng ký.
- BTC01–BTC03: 3 gian phục vụ sự kiện, không nhận đăng ký.

Áp dụng `V11__expanded_forty_position_plan.sql` bằng `pnpm db:migrate` trước khi đưa giao diện mới lên môi trường có database. API kiểm tra đủ 40 vị trí và sẽ báo lỗi khi database còn sơ đồ cũ.

Migration giữ ID và lịch sử của TM01–TM21, TT01–TT05, VH01–VH03 và BTC01–BTC03. ID 29–30 đổi từ VH04–VH05 thành TR01–TR02; ID 35–37 thành TM22–TM24; ID 38–40 thành TT06–TT08. Nếu các ID được dùng lại còn hồ sơ pending/approved, migration dừng để BTC xem xét, không tự xoá hồ sơ.

Toạ độ trong migration và `conceptPositions()` phải đồng bộ; `scripts/booth-plan.test.mjs` kiểm tra điều này, số lượng, mã thanh toán và giao nhau giữa các gian.

V12 sắp lại tọa độ theo cụm số liên tiếp: TM01–TM04 cột trái, TM05–TM11 hàng dưới, TM12–TM16 cột phải, TM17 phía trên hàng TM18–TM24 ở giữa. TT01 ở trên, TT02–TT04 hàng ngang, TT05–TT06 phía dưới; TT07–TT08 giữ khu Backdrop/Camera. Mã, ID, hồ sơ và lịch sử chuyển khoản không thay đổi.

V13 đổi lại nhãn TR01–TR02 thành VH04–VH05 theo đính chính; giữ nguyên ID 29–30, tọa độ và trạng thái không nhận đăng ký. Sơ đồ hiện tại có 4 nhóm: TM, TT, VH và BTC; tổng 40 vị trí, 32 gian nhận đề xuất.

V14: TT01–TT03 cùng hàng ngang, TT04–TT05 nối xuống dưới TT01 thành cụm chữ L; TT06 ở phía trên. TT07–TT08 giữ nguyên. Không đổi ID, mã hoặc hồ sơ.
