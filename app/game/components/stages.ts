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
    online: { summary: "60 giây · Khách đến liên tục", rules: ["Xếp 2–3 món đúng thứ tự đơn của khách rồi giao hàng.", "Phục vụ thật nhiều khách trong 60 giây, không giới hạn số đơn.", "Mỗi đơn đúng được 10 điểm. Giao sai không trừ điểm; hết giờ chờ khách sẽ rời tiệm."] },
    event: { summary: "60 giây · 10 điểm mỗi đơn", rules: ["Xếp các món từ trái sang phải theo đơn trên đầu mỗi khách.", "Khách đến liên tục trong 60 giây. Mỗi đơn đúng được 10 điểm.", "Kết quả bản chơi thử chưa dùng để nhận sticker hay đổi quà."] },
    challenge: "Sờ và đoán chất liệu bên trong hộp kín.",
  },
  {
    id: "print", name: "Xếp ván Đông Hồ", category: "Sắc màu dân gian", stamp: "Đôi mắt",
    description: "Xếp từng khối màu, đánh thức bức tranh dân gian sau màn sương.",
    story: "Sương Quên đã xóa nhòa bức tranh Đông Hồ. Mỗi lớp màu bạn in sẽ trả lại một phần ký ức và dấu ấn Đôi mắt.",
    online: { summary: "20 lớp tranh · 3 phút", rules: ["Kéo các khối vào bảng 8 × 8. Mỗi hàng hoặc cột đầy mở 1 phần tranh và được 10 điểm.", "Đạt 2 lớp để vượt chặng, tiếp tục đến tối đa 20 lớp để mở trọn bức tranh.", "Lượt chơi dừng khi hết 3 phút hoặc không còn chỗ đặt khối."] },
    event: { summary: "In 1 lớp màu", rules: ["Kéo và thả khối màu lên bảng để hoàn thành 1 lớp màu, rồi chốt kết quả.", "Kết quả bản chơi thử chưa dùng để nhận sticker hay đổi quà."] },
    challenge: "Tự tay in một lớp màu bằng ván khắc thật.",
  },
  {
    id: "rhythm", name: "Bắt nhịp di sản", category: "Âm vang đất Việt", stamp: "Đôi tai",
    description: "Lắng nghe câu hát, chạm theo nhịp phách và nối dài âm vang Việt.",
    story: "Muốn cất tiếng, trước hết phải biết lắng nghe. Theo những làn điệu Quan họ, Ca trù, Chèo, Xẩm để tìm lại dấu ấn Đôi tai.",
    online: { summary: "60 giây · Chạm và giữ nhịp", rules: ["Chạm đúng lúc nốt đến vạch; nốt có đuôi cần giữ đến hết. Nhạc và nốt nhanh dần trong 60 giây.", "Mỗi nốt đúng +10 điểm; hụt, thả sớm hoặc chạm sai −5 điểm. Điểm thấp nhất là 0.", "Đúng ít nhất 60% số nốt để vượt chặng."] },
    event: { summary: "Giữ nhịp 60 giây", rules: ["Chạm đúng làn, giữ nốt dài đến hết đuôi trong 60 giây với tốc độ tăng dần.", "Nốt đúng +10, nốt hụt −5; điểm thấp nhất 0. Đúng ít nhất 60% số nốt để đạt chặng. Nhạc tổng hợp dùng thử; kết quả chưa dùng nhận sticker hay đổi quà."] },
    challenge: "Gõ phách theo nghệ nhân trong 15 giây.",
  },
  {
    id: "place", name: "Đây là đâu?", category: "Dọc miền di sản", stamp: "Đôi chân",
    description: "Nhìn một khung hình, ghim một điểm đến. Bạn hiểu đất nước mình đến đâu?",
    story: "Những miền di sản đang chờ được gọi tên. Theo dấu các khung hình, tìm về đúng nơi chốn để khôi phục dấu ấn Đôi chân.",
    online: { summary: "10 hình ảnh · 20 giây / ảnh", rules: ["Quan sát ảnh không kèm tên và đặt ghim lên bản đồ Việt Nam.", "Có 10 ảnh dọc ba miền mỗi lượt, mỗi ảnh 20 giây. Ghim càng gần vị trí thật, điểm càng cao.", "Ít nhất 7/10 ảnh có vị trí ghim sai lệch dưới 100 km để vượt chặng."] },
    event: { summary: "2 hình ảnh · 20 giây / ảnh", rules: ["Quan sát 2 hình ảnh di sản và ghim vị trí trên bản đồ, mỗi ảnh 20 giây.", "Ghim lệch dưới 100 km ở ít nhất 1 ảnh để đạt bản rút gọn. Kết quả bản thử chưa dùng nhận sticker hay đổi quà."] },
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
