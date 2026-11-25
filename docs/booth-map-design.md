# Sơ đồ chỉ dẫn gian hàng

Mục tiêu: đọc nhanh mã gian, nhận biết cụm, theo được chiều đi và chọn đúng vị trí trên mobile. Giữ quan hệ không gian hiện có và toàn bộ ID, hồ sơ, trạng thái, API.

## Hệ trình bày

- Hội trường `#153B55`; thương mại `#3452A1`; văn hoá/tuyến tham quan `#087D73`; tài trợ `#9A650E`; nền `#F5F8FC`; bề mặt `#FFFFFF`.
- Be Vietnam Pro cho toàn sơ đồ: mã gian 24, nhãn khu 24, nội dung phụ 18–20 đơn vị SVG. Không dùng serif cho mã hay biển chỉ dẫn.
- Ô thương mại thống nhất kích thước; khe giữa các ô và giữa các cụm có nhịp riêng. Các vị trí đặc biệt lớn hơn để chứa tên thật.
- Mũi tên đầu nhỏ, góc rẽ bo, đường đi không chạm các ô. Thảm đỏ là tuyến riêng vào cửa 1, không nhầm với đường tham quan.

```text
                       Hội trường
                 Cửa 1 | GCD | Cửa 2
   Văn hoá       Thảm đỏ    Đổi quà | Back văn hoá
   VH01 VH02        |      TT01 TT02 TT03 | Camera
   VH03             |      TT04
   VH04 VH05        |      TT05
          TM01      |      TM17
          TM02      |      TM18 ... TM24 | Checkin
          TM03      |        đường tham quan < Lối vào
          TM04      |   < về khu văn hoá
       TM05 ... TM11       TM12
                          ...
                          TM16
```

Nhãn khu canh trái, tên và mã trong ô canh giữa. Chú giải nhóm/trạng thái nằm ngoài SVG để không co thành chữ quá nhỏ. Header chứa zoom, phần trăm và mở rộng; vùng dưới sơ đồ phản hồi gian đang chọn.

## Tự phản biện

Không chọn bản đồ thẻ với bóng/gradient: làm sai cảm giác mặt bằng. Không thêm đường chuyển động: chiều đi cần rõ khi đứng yên. Chỉ dùng màu để phân khu, đồng thời giữ tên/mã và ký hiệu trạng thái. Chế độ mở rộng dùng dialog native, hỗ trợ Escape và trả focus; mobile cho cuộn bản vẽ đủ lớn thay vì chỉ thu nhỏ mọi thứ.

Tọa độ trình bày nằm riêng trong `app/booths/components/booth-map-layout.ts`; tọa độ và khóa dữ liệu trong database giữ nguyên. BTC tiếp tục được ẩn khỏi sơ đồ theo yêu cầu trước đó. TT06 giữ mã và chú thích Gian đổi quà.

## Kiểm tra

`tests/booth-map.spec.ts` kiểm tra 37 ô hiển thị không chồng nhau và giữ nhóm tương đối; 32 gian có thể chọn, 5 gian văn hoá; trạng thái chờ/đã xác nhận/tạm khoá; chọn bằng bàn phím; zoom, dialog, Escape, trả focus và giữ lựa chọn; nhãn tiếng Anh. Ảnh QA ở `test-results/booth-wayfinding-desktop.png` và `test-results/booth-wayfinding-mobile-expanded.png`.

Tự đánh giá ảnh lần đầu: đường từ lối vào còn đứt ở góc nối và quá gần viền lựa chọn TM02. Đã nối thành một tuyến liên tục, lùi nhánh dọc sang phải và bổ sung mũi tên nhỏ ở hai đoạn thẳng. Chỉ dùng transition cho độ dày viền để chữ không mất tương phản trong lúc đổi màu trạng thái.
