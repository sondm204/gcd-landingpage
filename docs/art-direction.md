# Một Dải Di Sản

## Hướng thiết kế

Một trang sự kiện theo hành trình: mở đầu bằng collage Việt Nam, lời mời từ di sản, ba trạm trải nghiệm, không gian khám phá 3D và lời hẹn tham gia.

- Nền giấy ngà `#f3eddf`, đỏ son `#aa382a`, xanh trầm `#293e34`.
- Playfair Display và Be Vietnam Pro, có bộ ký tự tiếng Việt, được Next.js tự lưu trữ.
- Ảnh collage ở hero; minh hoạ các trạm bằng CSS/SVG để dễ thay đổi, không cần tải ảnh ngoài.
- Chuyển động mở đầu theo thứ tự; parallax nhẹ; reveal một lần khi vào vùng nhìn; lồng đèn đung đưa; dòng chữ chạy; thanh tiến trình.
- Tôn trọng `prefers-reduced-motion`. Nội dung vẫn đọc được khi JavaScript chưa tải.

## Ảnh được tạo

Sử dụng công cụ **image_gen tích hợp**, không dùng CLI/API key.

- Ảnh gốc: `public/images/heritage-collage.png`
- Ảnh dùng trên trang: `public/images/heritage-collage.webp` (1536 × 1024, khoảng 469 KiB)
- PNG được chuyển định dạng sang WebP bằng Sharp; không chỉnh sửa nội dung ảnh.

Prompt đã dùng:

> Use case: stylized-concept. Asset type: wide website hero artwork, no typography. Create a beautiful sophisticated Vietnamese cultural heritage editorial collage, handmade cut-paper mixed with vintage photographic etchings on a warm ivory rice paper background #f3eddf. Landscape aspect ratio 3:2. Composition: a richly detailed imaginary miniature landscape in lower two-thirds, lots of empty ivory space in top quarter. On left terraced rice fields and tall Ha Long limestone mountains in muted jade green, foreground traditional ochre Hanoi Turtle Tower and red temple architecture, in center a winding pale golden river/path and a small red Vietnamese sailing junk, on right a large elegant Hue imperial gate with layered dark teal tiled roofs and ochre red columns, a cluster of Hoi An yellow houses and hanging red lanterns. Foreground pink lotus blossoms and dark green lotus leaves, a tiny person wearing a conical hat crossing a red wooden bridge. A large flat vermilion setting sun behind the central landscape, a few fine ink flying cranes. Antique engraved photographic detail, visible paper cutout edges, subtly surreal assemblage, asymmetrical layered art direction, premium art festival poster quality, earthy palette of jade, vermilion, mustard and ivory. Landscape fades to plain warm ivory around all outer edges so it blends into a webpage. No text, no letters, no logos, no watermark, no UI. Save generated artifact for project use.

Ảnh và mô hình 3D là diễn giải nghệ thuật, không phải tư liệu phục dựng kiến trúc chính xác.

## Hero toàn màn hình — phiên bản 2

Ảnh mới được chỉnh từ collage gốc bằng **image_gen tích hợp**, lưu riêng để giữ bản cũ:

- `public/images/heritage-panorama.png`: ảnh gốc mới.
- `public/images/heritage-panorama.webp`: ảnh dùng trên hero, 1672 × 941, khoảng 478 KiB.

Hero dùng ảnh phủ kín viewport (`object-fit: cover`), typography căn giữa phía trên ảnh, lớp phủ nhẹ bảo đảm tương phản, thanh điều hướng trong suốt ở đầu trang. Các lớp SVG chim, mây và thuyền cùng vệt nước chạy bằng CSS transform/opacity, độc lập với ảnh nền. Nút tạm dừng và `prefers-reduced-motion` kiểm soát vòng lặp; IntersectionObserver và Page Visibility ngừng chuyển động khi không nhìn thấy hero.

Prompt chỉnh ảnh:

> Edit the supplied Vietnamese heritage collage into a full-bleed immersive website hero background. Preserve its beautiful vintage rice-paper etching, intricate architectural photographic collage, muted jade forest greens, vermilion sun and warm ivory atmosphere. Landscape wide cinematic 16:9 composition. Fill all edges with landscape; REMOVE the plain paper margins and torn-paper border. Recompose for a large centered website headline: the upper middle 50 percent is quiet misty light cream sky, with a small muted vermilion sun off center right. Limestone mountains and terraced fields frame the LEFT edge. Detailed Hue imperial gate and Hoi An architecture frame the RIGHT edge. Keep center sky open and clean, not cluttered, with pale distant mountain silhouettes. The LOWER CENTER from 65 to 90 percent height is a BROAD calm jade river with open navigable water, winding toward the horizon. Foreground left lotus blossoms, leaves, ancient Turtle Tower. Lower right red bridge and trees. No birds, no boats, no clouds in foreground: these will be added as independently animated website layers. No text, no letters, no logos, no watermark, no UI. High-detail premium cultural art festival landscape. The entire image must feel like one continuous expansive Vietnamese landscape, not an illustration floating on blank paper.
