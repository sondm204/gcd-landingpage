# Passport ghé gian hàng

## Chuẩn bị

1. Chạy `pnpm db:migrate` đến V16. Dùng Supabase và tài khoản trong `booth_admins` hiện có.
2. Đặt `SITE_URL` thành tên miền công khai, ví dụ `https://gcd-landingpage.vercel.app`, trước khi xuất QR. `APP_ORIGIN` khớp origin dùng để gửi form. Không cần biến môi trường hoặc dịch vụ QR mới.
3. Đăng nhập `/game/admin`. Mặc định nhận dấu và đổi quà đều **đóng**, mốc dấu **chưa thiết lập**.
4. Kiểm tra danh sách gian, đặt tên riêng hoặc tắt các vị trí không tham gia. Mặc định tạo điểm nhận dấu cho các vị trí đang hoạt động, trừ khu `Gian BTC`. Tên ưu tiên tên riêng, rồi tên gian đã duyệt, rồi mã vị trí.
5. Tải từng QR SVG hoặc dùng **In toàn bộ QR đang bật**, đặt đúng QR tại gian tương ứng. Nếu vừa bổ sung vị trí trong sơ đồ, bấm **Đồng bộ gian hàng**.
6. Bật nhận dấu khi sự kiện bắt đầu. Mốc đổi quà và tên quà có thể cấu hình sau; phải có mốc trước khi bật đổi quà.

## Người tham dự

- Vào `/game`, nhập SĐT. Số đã đăng ký vào thẳng; số mới chọn thêm tên duy nhất. Dùng chung tài khoản game online.
- Chọn tab **Tại sự kiện** (`/game?tab=event`) để xem các gian đã ghé/chưa ghé, thời điểm nhận dấu, tổng dấu và QR cá nhân.
- Dùng Camera/ứng dụng QR trên điện thoại quét mã tại gian. Liên kết mở `/game/check-in#code=…`, tự nhận dấu sau khi đăng nhập. Mã vẫn được giữ trong lúc nhập SĐT/tên.
- Có thể dán liên kết QR vào mục hướng dẫn trên passport nếu cần. Không có chức năng người chơi tự chọn gian để cộng dấu.
- Mỗi tài khoản chỉ nhận **một dấu mỗi vị trí**, kể cả quét lại hoặc mở nhiều tab. Dấu gắn với vị trí QR, không đổi khi gian tại vị trí được đổi tên. Nếu BTC chuyển thương hiệu sang vị trí khác, cần kiểm tra và in lại QR tại vị trí mới.
- Dấu sự kiện không cộng điểm game, không tiêu thụ lượt chơi.

## Đổi quà

Người chơi xuất trình QR cá nhân trên passport. BTC quét bằng điện thoại đã đăng nhập quản trị; liên kết `/game/admin#card=…` mở ngay hồ sơ nhận quà. Nếu chưa đăng nhập, mã được giữ qua màn đăng nhập quản trị. Có thể dán liên kết/mã ở quầy dùng máy tính.

Server kiểm tra số dấu, thời gian mở đổi quà và lịch sử. BTC xem tên, các gian đã ghé, rồi xác nhận **khi thực sự trao quà**. Mỗi tài khoản đổi **một lần**; các yêu cầu đồng thời cũng chỉ tạo một bản ghi. Lưu mốc quy định, số dấu, tên quà, thời điểm và admin trao quà để đối soát. Dấu vẫn được giữ sau khi nhận quà. Thay đổi quy chế về sau không mở lại quyền nhận quà của người đã đổi.

## Dữ liệu và vận hành

V16 thêm `event_passport_settings`, `event_passport_stations`, `event_passport_stamps`, `event_passport_redemptions` và `game_players.passport_code`. Các bảng bật RLS, chỉ server service role được truy cập; RPC quản trị kiểm tra `booth_admins.active`. Client người chơi không nhận bí mật QR của các gian. QR cá nhân chỉ dùng tra cứu qua API quản trị, không phải cookie đăng nhập.

QR dùng mã ngẫu nhiên dài và đặt trong URL fragment để không đưa vào query/access log. QR tĩnh có thể bị chia sẻ lại; đây là cơ chế ghi nhận từ mã tại gian, không chứng minh vị trí vật lý. BTC kiểm soát giờ mở nhận dấu, có thể tắt từng gian hoặc thay mã nếu bị chia sẻ. Thay mã vô hiệu bản in cũ, không xóa dấu đã nhận. Không đưa các mã/QR vào tài liệu công khai ngoài bản in tại gian.

Các endpoint cá nhân cần cookie người chơi; endpoint admin cần Supabase admin cookie. Không thể lấy dấu chỉ bằng GET/prefetch liên kết. Claim và trao quà dùng POST cùng origin, không cache dữ liệu cá nhân.

## Kiểm thử

- `pnpm test:games:db`: PostgreSQL tạm kiểm tra lịch sử V1–V16, đăng nhập chỉ SĐT, một dấu mỗi gian, đổi mã, RLS, mốc quà, trao quà một lần kể cả hai transaction đồng thời.
- `pnpm build` rồi `pnpm test:games:app`: Next.js production với transport Supabase giả, kiểm tra UI điện thoại, QR SVG/PNG, luồng quét sau đăng nhập, tab passport và trao quà. Không tạo tài khoản/dấu thử trên Supabase thật.
