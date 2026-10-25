# Đặt vị trí gian hàng — Global Citizens Day 2026

## Các trang và quy trình

- `/booths`: sơ đồ 40 vị trí, chọn ô, xem trạng thái và gửi đề xuất không cần tài khoản. Liên kết từ phần hội chợ trên landing page.
- `/booths/admin/login`: đăng nhập email/mật khẩu Supabase Auth.
- Sau khi đăng nhập, `/booths` chuyển sang chế độ quản trị ngay trên sơ đồ. Chọn một ô để xem các đề xuất tại vị trí đó, lọc trạng thái, xem liên hệ/ảnh riêng tư và duyệt hoặc từ chối. Khu tổng quan nhóm các hồ sơ theo vị trí. `/booths/admin` chuyển hướng về trang này.

Một vị trí có thể nhận nhiều đề xuất `pending`. Gửi đề xuất không giữ chỗ. Admin duyệt một đề xuất thì trạng thái của nó thành `approved`; các đề xuất `pending` khác của cùng vị trí thành `rejected`. Từ chối riêng một đề xuất không khoá vị trí. Đề xuất bị từ chối không được duyệt lại.

Với gian hàng đã chốt, chọn **Sửa thông tin / ảnh / vị trí** để sửa tên thương hiệu, tên gian hàng, nội dung, liên hệ, website và ảnh (giữ/bỏ/thêm, tối đa 3 ảnh). Có thể chuyển sang ô chưa có gian hàng được xác nhận; phải xác nhận việc chuyển. Ô cũ mở lại, các đề xuất đang chờ tại ô đích được từ chối. Không ghi đè hay hoán đổi với gian hàng đã chốt khác; các đề xuất từng bị từ chối ở ô cũ không tự mở lại.

Migration `V2__admin_edit_confirmed_booths.sql` bổ sung `updated_at`, RPC cập nhật và bảng riêng tư `booth_change_events` lưu dữ liệu trước/sau cùng admin và ghi chú. Cập nhật kiểm tra phiên bản hồ sơ; nếu admin khác vừa sửa, API trả 409 để tải lại. Khoá ô nguồn/đích và unique index bảo đảm không chốt trùng vị trí. Ảnh bỏ khỏi hồ sơ vẫn được giữ trong Storage private phục vụ lịch sử, không xoá vật lý tự động.

Mỗi thao tác duyệt có bước xác nhận và được lưu ở `booth_review_events`. Hệ thống chưa gửi email/SMS tự động; admin dùng thông tin liên hệ để trao đổi kết quả. Không có thanh toán hoặc thu phí.

## 1. Cấu hình ứng dụng

Sao chép `.env.example` thành `.env.local` và điền:

| Biến | Ý nghĩa |
| --- | --- |
| `APP_ORIGIN` | Origin thực tế, ví dụ `http://localhost:3000` hoặc `https://your-domain.vn`; dùng kiểm tra Origin cho API ghi |
| `SUPABASE_URL` | Project URL của Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key hoặc legacy anon key, dùng Supabase Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Khoá service-role chỉ trên server, dùng database và Storage |
| `BOOTH_RATE_LIMIT_SECRET` | Chuỗi ngẫu nhiên ít nhất 32 byte, dùng HMAC định danh giới hạn tần suất |

Không đưa các khoá vào biến `NEXT_PUBLIC_*`. Không commit `.env.local` hoặc mật khẩu database. Các file `.example` được phép commit.

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
pnpm dev
```

Khi chưa có config, `/booths` chỉ hiển thị sơ đồ dự kiến và vô hiệu hoá form. Không ghi dữ liệu giả hoặc giả lập xác nhận. Khi đã cấu hình nhưng database chưa sẵn sàng, trang báo lỗi để tránh hiển thị các vị trí trống sai sự thật.

## 2. Tạo bảng bằng Flyway

Lấy connection string trong Supabase Dashboard → Connect bằng quyền database owner. Dùng kết nối trực tiếp hoặc **Session Pooler cổng 5432**; không dùng Transaction Pooler cổng 6543 cho migration.

Các lệnh `pnpm db:*` không yêu cầu Flyway trong PATH. Runner ưu tiên CLI đã cài, tiếp theo là bản portable `.tools/flyway/`, sau đó Docker nếu Engine đang chạy. Nếu chưa có cả hai, runner tải Flyway Open Source phiên bản ghim `13.11.1` từ GitHub chính thức, kiểm tra SHA-256 theo release metadata và giải nén trong `.tools/` (không commit). Cần Internet ở lần cài đầu; website không tải hay chạy Flyway trong lúc hoạt động.

```powershell
pnpm db:setup       # Cài/kiểm tra CLI portable; không kết nối database
pnpm db:info        # Đọc trạng thái migrations, không thay đổi schema
pnpm db:validate    # Kiểm tra migration/checksum
pnpm db:migrate     # Áp dụng migrations chưa chạy
```

Nếu công ty đã cài CLI ở một thư mục khác, đặt `GCD_FLYWAY_CLI` tới file `flyway.cmd`/`flyway`. Mật khẩu chỉ truyền qua environment, không đưa vào command line; output được che mật khẩu. Runner chỉ hỗ trợ setup/version/info/validate/migrate, không hỗ trợ clean/repair.

`.env.flyway.example` là mẫu các biến dành cho Flyway. Runner tự đọc `.env.flyway`; không đọc `.env`/`.env.local` của Next.js. Biến environment sẵn có trong CI/shell được ưu tiên hơn file. Nếu mật khẩu chứa `#`, khoảng trắng hoặc ký tự đặc biệt, bọc giá trị bằng dấu nháy, ví dụ `FLYWAY_PASSWORD='your#password'`.

```powershell
Copy-Item .env.flyway.example .env.flyway
# Điền thông tin trong .env.flyway. Runner tự nạp file này:
pnpm db:info
pnpm db:migrate
pnpm db:validate
```

Đường dẫn migration: `db/migrations/V1__booth_booking.sql`. Flyway dùng bảng lịch sử riêng `public.gcd_flyway_schema_history`, không chạy `clean`. Không chỉnh nội dung migration sau khi đã chạy lên môi trường dùng chung; thay đổi tiếp theo tạo `V2__...sql`.

### Khi deploy

Flyway là bước cập nhật database riêng, không nằm trong `next build`, API request hoặc khi Next.js khởi động. Có thể chạy migration từ máy quản trị trước khi deploy; khi tự động hoá, đặt `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD` trong secret của CI và chạy `pnpm db:migrate` trước bước deploy. Chỉ deploy ứng dụng nếu migration thành công. Vercel/hosting Next.js không cần Java, Docker hoặc Flyway để phục vụ website. Migration sau này cần tương thích với phiên bản web còn đang chạy.

Migration tạo:

- `booth_positions`: 40 vị trí, mã B01–B40, khu và toạ độ sơ đồ.
- `booth_proposals`: thông tin đăng ký, ảnh, mã tham chiếu, trạng thái xét duyệt.
- `booth_admins`: danh sách tài khoản được cấp quyền.
- `booth_review_events`: lịch sử quyết định.
- `booth_rate_limits`: hạn mức theo cửa sổ thời gian, tự dọn bản ghi cũ.
- `booth_public_map`: view chỉ gồm vị trí, số đề xuất đang chờ và tên thương hiệu/gian hàng được duyệt; không có email, điện thoại, người liên hệ hay ảnh.
- Các RPC server-only để gửi đề xuất, duyệt và giới hạn tần suất.
- Bucket Storage riêng tư `booth-proposals`, tối đa 1 MB/file, JPEG/PNG/WebP.

Bucket được tạo bằng SQL, không cần tạo thủ công trong Dashboard. RLS bật trên toàn bộ bảng nghiệp vụ; `anon` và `authenticated` không được truy cập trực tiếp. Chỉ các API Next.js dùng service-role sau validation/kiểm tra quyền.

## 3. Tạo admin đầu tiên

1. Trong Supabase Dashboard → Authentication → Users, tạo tài khoản email/mật khẩu dành cho ban tổ chức. Hoàn tất xác nhận email nếu cấu hình Auth yêu cầu. Không có đăng ký tài khoản công khai trong app.
2. Sao chép User UUID của tài khoản.
3. Chạy câu lệnh dưới đây trong SQL Editor bằng tài khoản owner, thay UUID:

```sql
insert into public.booth_admins(user_id, active)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid, true)
on conflict (user_id) do update set active = true;
```

4. Mở `/booths/admin/login`. Tài khoản Supabase Auth thông thường không có dòng active trong `booth_admins` sẽ không được vào quản trị.

Để thu hồi quyền: `update public.booth_admins set active = false where user_id = '...'`. Mỗi API quản trị xác minh user với Supabase Auth và kiểm tra lại quyền; không chỉ dựa vào việc đã đăng nhập hoặc ẩn nút trên giao diện.

## Quy tắc đồng thời, upload và quyền riêng tư

Phần mô tả gian hàng không bắt buộc và không có độ dài tối thiểu; tối đa 2000 ký tự. Migration `V3__optional_booth_description.sql` bỏ ràng buộc tối thiểu ở database; schema API luôn truyền chuỗi rỗng khi không nhập mô tả.

- RPC duyệt khoá hàng `booth_positions` bằng `FOR UPDATE` trước khi xử lý đề xuất. Hai thao tác duyệt cùng vị trí được tuần tự hoá. Partial unique index trên `position_id WHERE status='approved'` bảo vệ thêm ở mức database.
- RPC gửi cũng khoá vị trí để không thêm đề xuất sau khi ô đã được chốt. Đề xuất đang chờ không độc chiếm ô.
- Form gửi `Idempotency-Key` UUID. Retry cùng nội dung trả lại mã tham chiếu cũ; không tạo bản ghi/ảnh trùng. Dùng cùng key với nội dung khác trả 409. Mất phản hồi sau khi database đã commit không xoá ảnh đang được tham chiếu.
- Tối đa 3 ảnh, mỗi ảnh 1 MB, tổng request khoảng 3 MB. Server kiểm tra kích thước, MIME và chữ ký file. Không nhận SVG. Ảnh nằm trong bucket private; API admin cấp signed URL có hiệu lực 5 phút. Tải lại danh sách để lấy link mới khi hết hạn.
- Upload và database không cùng transaction: các ảnh chưa được dùng được dọn sau lỗi khi xác minh được rằng chưa có bản ghi tham chiếu. Nếu Storage/DB mất kết nối trong lúc dọn, có thể còn ảnh mồ côi; có thể dọn theo lịch sau khi đối chiếu `image_paths`. Không xoá bừa các ảnh theo ngày vì có thể vẫn đang dùng.
- Có kiểm tra Origin, honeypot và hạn mức lưu ở database (12 lần/IP/giờ, 5 lần/email/giờ; login 10 lần/IP/15 phút). IP được HMAC trước khi lưu làm key; không lưu địa chỉ IP thô trong bảng hạn mức.
- Khi triển khai sau reverse proxy, proxy phải ghi đè `X-Forwarded-For`/`X-Real-IP` theo địa chỉ thực, không tin header khách tự gửi. Nếu không có header, các request dùng chung bucket `unknown`.
- Tên thương hiệu/gian hàng đã được duyệt có thể xuất hiện công khai; liên hệ và ảnh chỉ dùng cho xét duyệt. Có checkbox đồng ý trước khi gửi.
- API trả `Cache-Control: no-store`; endpoint sơ đồ luôn chạy theo request bằng `connection()`, không prerender trạng thái đặt chỗ. Admin không được index bởi robot.

## Chỉnh sơ đồ theo địa điểm thực tế

Hiện là sơ đồ SVG ý tưởng 40 vị trí, không phải bản vẽ thi công. Toạ độ tính theo phần trăm trên viewBox 1000 × 760. Dữ liệu thật nằm trong `booth_positions`; bản preview khi chưa cấu hình nằm ở `conceptPositions()` trong `lib/booths/types.ts`. Khi thay bố cục, cập nhật bằng migration mới và đồng bộ bản preview. Nếu đổi số lượng vị trí, cần cập nhật validation, form/admin selector và quy tắc sơ đồ.

## Kiểm thử

```powershell
pnpm build
pnpm test:booths:db
pnpm test:booths:app
pnpm test:flyway
pnpm test:booths:flyway
```

- `test:booths:db`: tạo một cluster PostgreSQL **mới** trong `test-results/booth-db-*`, dựng các schema/role Supabase tối thiểu cho kiểm thử, chạy đúng SQL migration, kiểm tra quyền riêng tư, xét duyệt, idempotency, rate limit và hai quyết định duyệt đồng thời. Không dùng database ứng dụng hiện có. Set `PG_BIN` tới thư mục chứa `initdb`, `pg_ctl`, `psql` nếu khác mặc định. Server tạm được dừng sau test; thư mục dữ liệu được giữ trong `test-results/` để điều tra nếu cần.
- `test:booths:app`: chạy Next.js production với endpoint Supabase giả lập cục bộ, kiểm tra API thực, cookie auth, public form, upload, retry, admin login/approval/logout và responsive. Không gọi dự án Supabase thật.
- `test:flyway`: kiểm tra đọc `.env.flyway`, ưu tiên secret CI, validation và che mật khẩu.
- `test:booths:flyway`: giống bài kiểm tra PostgreSQL tạm nhưng dùng Flyway CLI thật để migrate, migrate lần hai và validate checksum. Connection được ghi đè thành localhost; không dùng Supabase trong `.env.flyway`.

Nếu `db:info` báo `UnknownHostException` khi dùng Direct connection, lỗi xảy ra trước bước xác thực. Giữ host đúng như Dashboard → Connect, kiểm tra project đang active và khả năng phân giải DNS/IPv6 của môi trường chạy Flyway. Direct mặc định dùng IPv6 nếu chưa có IPv4 add-on; runner không tự sửa `.env.flyway` hay tự đổi sang pooler. Có thể chạy Flyway từ máy/CI có kết nối Direct khả dụng.

Sau khi có config thật, chạy migration, tạo admin rồi smoke test `/booths` trên môi trường staging: gửi hai đề xuất một ô, duyệt một, kiểm tra ô đã xác nhận và proposal còn lại bị đóng. Kiểm tra upload/signed URL và session thực của Supabase trước khi mở cổng công khai.
