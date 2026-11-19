# Tài khoản, lượt chơi và bảng xếp hạng game

Chạy migrations Flyway đến `V16__phone_login_event_passports.sql` bằng `pnpm db:migrate` trước khi sử dụng. Dùng chung `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` hiện có. `APP_ORIGIN` phải trùng origin website đang chạy. Không thêm khóa `NEXT_PUBLIC_`. Passport sự kiện và vận hành QR được mô tả trong [event-passport.md](event-passport.md).

Lịch sử V5–V14 được đồng bộ nguyên bản từ `origin/main` để Flyway kiểm tra checksum của database hiện có. Các fixture SQL gian hàng đi kèm lịch sử này cũng được đồng bộ để kiểm thử toàn bộ chuỗi migration.

## Quy tắc

- Khi vào `/game`, người chơi nhập số điện thoại trước. Số đã đăng ký vào thẳng tài khoản; số mới được yêu cầu thêm tên hiển thị duy nhất rồi mới tạo tài khoản.
- Số Việt Nam dạng `0912…`, `+84912…`, `84912…`, `0084912…` quy về cùng số E.164. Quốc tế dùng mã quốc gia với `+`.
- Tên được chuẩn hóa Unicode NFKC, gộp khoảng trắng, kiểm tra trùng không phân biệt chữ hoa/thường. Tên hiện tại không đổi qua màn đăng nhập.
- Cơ chế này không có OTP hoặc mật khẩu theo yêu cầu sản phẩm: biết số điện thoại là có thể vào tài khoản. Đây không phải xác minh chủ sở hữu số điện thoại.
- Phiên dùng token ngẫu nhiên 256 bit trong cookie HttpOnly/SameSite=Lax; database chỉ lưu SHA-256 của token. Cookie có hạn 30 ngày; đăng xuất thu hồi phiên hiện tại.
- Mỗi tài khoản có **3 lượt/game**, dùng chung mọi thiết bị. Tính khi bấm bắt đầu, không tính khi chỉ mở trang. Rời hoặc reload giữa lượt vẫn dùng một lượt. Bắt đầu lượt khác đóng lượt còn dở của cùng game. Tab tại sự kiện chỉ hiển thị passport ghé gian hàng; dấu QR độc lập với lượt và điểm game.
- Điểm tổng là tổng **điểm cao nhất của từng game**. Mỗi thư hợp lệ ở game 5 nhận 100 điểm, nên tối đa game 5 đóng góp 100 vào tổng.
- Game 5 chỉ gửi thư riêng đến BTC, không quay video, tải PNG hay chia sẻ ảnh. Lưu địa điểm, khung thiệp, lời thư và tên người gửi trong `game_letters`.

## Dữ liệu và kiểm tra server

`game_players`, `game_sessions`, `game_attempts`, `game_letters` bật RLS và thu hồi quyền truy cập trực tiếp của anon/authenticated. Chỉ server dùng service role. Bảng xếp hạng chỉ trả ID công khai, tên và điểm; không trả số điện thoại, token, thư hoặc diễn biến lượt chơi.

RPC bắt đầu lượt khóa hàng tài khoản trong transaction; unique `(player_id, game, attempt_number)` cùng check 1–3 chặn vượt lượt ngay cả khi nhiều tab gửi đồng thời. Request key UUID giúp thử lại thao tác bắt đầu mà không mất lượt mới.

Bốn game đầu gửi chuỗi thao tác; Next.js validate schema, kiểm tra seed và thời gian rồi chạy lại reducer để tính điểm. Không nhận số điểm tự khai từ client. Game 1 dùng đơn mở đầu xác định bởi seed; game 2 dùng seed phát khối; game 4 dùng seed chọn địa điểm. Cơ chế này kiểm tra luật chơi, không bảo đảm ngăn được bot tự chơi hay tài khoản giả do không có xác minh số điện thoại.

Gửi kết quả gắn với đúng chủ lượt và fingerprint SHA-256. Gửi lại cùng kết quả không cộng điểm hoặc tạo thư trùng; sửa kết quả sau khi lưu bị từ chối. Client lưu hàng chờ kết quả vào localStorage để thử gửi lại khi mất kết nối. Không dùng localStorage làm nguồn quyết định lượt/điểm.

Lượt chưa chốt hết hạn ghi điểm sau 6 giờ. Điểm mỗi game không âm, được giới hạn bởi reducer; thư kiểm tra 1–20 từ và tối đa 240 ký tự. Nội dung thư không được đưa lên bảng xếp hạng.

## Đường dẫn

- `/game`: nhập tài khoản, điểm tốt nhất và lượt còn lại.
- `/game?tab=event`: hộ chiếu con dấu của các gian đã ghé.
- `/game/admin`: ban tổ chức cấu hình nhận dấu, QR và trao quà; dùng tài khoản quản trị gian hàng hiện có.
- `/game/leaderboard`: tổng điểm và 5 bảng riêng, phân trang 50 người; đồng điểm cùng hạng.
- `GET/POST/DELETE /api/game/session`: phiên và đăng nhập/đăng xuất.
- `POST /api/game/attempts`: giữ một lượt.
- `POST /api/game/attempts/[id]`: tính và lưu điểm hoặc gửi thư.
- `GET /api/game/leaderboard?game=total|craft|print|rhythm|place|postcard&page=0`: bảng công khai.

## Kiểm thử

`pnpm test:games:db`: tạo PostgreSQL tạm trong `test-results/`, áp dụng migrations và kiểm tra uniqueness, privacy, chốt thư một lần, max-score và 4 yêu cầu đồng thời chỉ có 3 lượt. Không kết nối Supabase thật.

`pnpm test:games:app`: chạy Next.js production với transport Supabase giả độc lập; kiểm tra đăng nhập hai bước, uniqueness, giới hạn 3 thư, lỗi trả về sau commit và lưu lại, replay bốn game, QR giữ qua đăng nhập, dấu không trùng, quản trị QR, mốc quà và trao quà một lần. Bảng điểm không lộ số điện thoại.

Các bài Playwright kiểm tra cơ chế game dùng `tests/game-fixture.ts` để không tiêu thụ lượt hay gửi dữ liệu vào tài khoản thật. Các file unit test reducer tiếp tục chạy độc lập.

