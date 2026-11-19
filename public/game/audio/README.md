# Nhạc nền Xếp ván Đông Hồ

`place-background.wav` là nhạc nguyên bản riêng cho “Đây là đâu?”: giai điệu ngũ cung nhẹ với bass mềm, 92 BPM, vòng 24 phách khoảng 15,65 giây, PCM mono 22.050 Hz. Tổng hợp từ sóng sin, không dùng bản thu hay mẫu nhạc bên thứ ba. Nhạc phát trong lượt chơi, dừng khi tạm nghỉ, kết thúc hoặc rời trang.

`dong-ho-background.wav` là đoạn nhạc tổng hợp nguyên bản cho bản chơi thử: giai điệu ngũ cung, tiếng gảy nhẹ và bass mềm, 88 BPM, dài khoảng 21,82 giây, PCM mono 22.050 Hz. Không sử dụng mẫu thu âm hay bản nhạc của bên thứ ba. Phần đuôi nốt được nối vòng để phát lặp.

`craft-shop-background.wav` là giai điệu nguyên bản riêng cho Tiệm Bách nghệ: Sol trưởng, 112 BPM, tiếng gõ vui hơn, bass và nhịp nhẹ, vòng lặp khoảng 17,14 giây, PCM mono 22.050 Hz. Không sử dụng mẫu nhạc bên thứ ba.

Đường dẫn, âm lượng (0,25), phát/dừng và nút bật/tắt nằm tại `app/game/hooks/use-background-music.ts`; mỗi game truyền file nhạc riêng. Nhạc bắt đầu sau thao tác mở game, dừng khi kết thúc/rời game và tạm dừng khi tab bị ẩn. Âm thanh hiệu ứng được điều khiển độc lập: `craft-shop/use-shop-audio.ts` cho chọn/bỏ món, giao đúng/sai và khách rời đi; `dong-ho/use-print-audio.ts` cho đặt khối và in hàng/cột. Hai game dùng các tần số/âm sắc hiệu ứng khác nhau.
