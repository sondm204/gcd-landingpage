export type GameMode = "online" | "event";
export type StageId = "craft" | "print" | "rhythm" | "place" | "postcard";

export const stages: {
  id: StageId;
  name: string;
  category: string;
  stamp: string;
  description: string;
  story: string;
  online: { summary: string; rules: string[] };
  event: { summary: string; rules: string[] };
  challenge: string;
}[] = [
  {
    id: "craft", name: "Tiệm Bách nghệ", category: "Làng nghề Hà Nội", stamp: "Đôi tay",
    description: "Ghé tiệm thủ công, tìm đúng món đồ và trao gửi tinh hoa làng nghề.",
    story: "Di sản sống trong đôi tay người thợ. Hãy cùng Chú Tễu học việc tại tiệm thủ công và tìm lại dấu ấn Đôi tay.",
    online: { summary: "60 giây · 5 đơn hàng", rules: ["Chạm chọn sản phẩm đúng với làng nghề rồi giao cho khách.", "Hoàn thành đúng 4 trong 5 đơn hàng trong 60 giây để vượt chặng.", "Giao đúng liên tiếp để tạo combo; giao sai sẽ làm mất chuỗi."] },
    event: { summary: "Giao 3 đơn hàng", rules: ["Chọn đúng sản phẩm ứng với làng nghề và giao 3 đơn hàng.", "Xuất trình kết quả hoàn thành cho chủ gian để nhận túi sticker giấy."] },
    challenge: "Sờ và đoán chất liệu bên trong hộp kín.",
  },
  {
    id: "print", name: "Xếp ván Đông Hồ", category: "Sắc màu dân gian", stamp: "Đôi mắt",
    description: "Xếp từng khối màu, đánh thức bức tranh dân gian sau màn sương.",
    story: "Sương Quên đã xóa nhòa bức tranh Đông Hồ. Mỗi lớp màu bạn in sẽ trả lại một phần ký ức và dấu ấn Đôi mắt.",
    online: { summary: "Xếp khối · Không giới hạn giờ", rules: ["Kéo các khối màu vào bảng 8 × 8 ô. Lấp đầy một hàng để hoàn thành lớp màu.", "Hoàn thành 2 lớp để vượt chặng, đủ 4 lớp để hiện trọn bức tranh; nét đen là lớp cuối.", "Lượt chơi dừng khi không còn chỗ đặt khối."] },
    event: { summary: "In 1 lớp màu", rules: ["Kéo và thả khối màu lên bảng để hoàn thành 1 lớp màu.", "Cho chủ gian xem kết quả hoàn thành để nhận túi sticker giấy."] },
    challenge: "Tự tay in một lớp màu bằng ván khắc thật.",
  },
  {
    id: "rhythm", name: "Bắt nhịp di sản", category: "Âm vang đất Việt", stamp: "Đôi tai",
    description: "Lắng nghe câu hát, chạm theo nhịp phách và nối dài âm vang Việt.",
    story: "Muốn cất tiếng, trước hết phải biết lắng nghe. Theo những làn điệu Quan họ, Ca trù, Chèo, Xẩm để tìm lại dấu ấn Đôi tai.",
    online: { summary: "30 giây · Chạm theo nhịp", rules: ["Chạm đúng lúc nốt nhạc rơi đến vạch trong đoạn nhạc 30 giây.", "Chạm đúng ít nhất 60% số nốt để vượt chặng.", "Giữ combo để tăng điểm với các mức Tuyệt, Được và Trượt."] },
    event: { summary: "Giữ nhịp 30 giây", rules: ["Lắng nghe và chạm theo nhịp phách trong 30 giây.", "Xuất trình kết quả hoàn thành tại gian để nhận túi sticker giấy."] },
    challenge: "Gõ phách theo nghệ nhân trong 15 giây.",
  },
  {
    id: "place", name: "Đây là đâu?", category: "Dọc miền di sản", stamp: "Đôi chân",
    description: "Nhìn một khung hình, ghim một điểm đến. Bạn hiểu đất nước mình đến đâu?",
    story: "Những miền di sản đang chờ được gọi tên. Theo dấu các khung hình, tìm về đúng nơi chốn để khôi phục dấu ấn Đôi chân.",
    online: { summary: "3 hình ảnh · 20 giây / ảnh", rules: ["Quan sát ảnh không kèm tên và đặt ghim lên bản đồ Việt Nam.", "Có 3 ảnh mỗi lượt, mỗi ảnh 20 giây. Ghim càng gần vị trí thật, điểm càng cao.", "Ít nhất 2 ảnh có vị trí ghim sai lệch dưới 100 km để vượt chặng."] },
    event: { summary: "Ghim vị trí cho 2 hình ảnh", rules: ["Quan sát 2 hình ảnh di sản và ghim vị trí trên bản đồ.", "Cho chủ gian xem kết quả hoàn thành để nhận túi sticker giấy."] },
    challenge: "Gắn cờ di sản quê mình lên bản đồ lớn tại gian.",
  },
  {
    id: "postcard", name: "Đại sứ di sản", category: "Kể chuyện Việt ra thế giới", stamp: "Tiếng nói",
    description: "Gửi một tấm postcard, kể câu chuyện di sản bằng tiếng nói của riêng bạn.",
    story: "Hành trình đưa bạn trở về với gốc rễ, để tự tin bước ra thế giới. Hãy gửi lời giới thiệu di sản Việt Nam đến bạn bè quốc tế.",
    online: { summary: "Sáng tạo postcard · Tối đa 20 từ", rules: ["Chọn khung postcard và viết một câu tiếng Anh giới thiệu di sản, tối đa 20 từ.", "Bạn có thể quay thêm clip 15 giây đọc câu giới thiệu.", "Postcard được ban tổ chức duyệt trước khi xuất hiện trên tường postcard."] },
    event: { summary: "Viết postcard tại gian", rules: ["Chọn khung và viết postcard giới thiệu di sản Việt Nam trên điện thoại.", "Nội dung postcard cần được ban tổ chức duyệt trước khi hiển thị công khai."] },
    challenge: "Nói tiếng Anh trong 30 giây để giới thiệu một di sản.",
  },
];
