import Image from "next/image";
import type { BoothProposal } from "@/lib/booths/types";
export default function BoothPaymentReview({ proposal }: { proposal: BoothProposal }) {
  if (!proposal.payment) return null;
  const payment = proposal.payment;
  return <section className="booth-alert"><strong>Thông tin chuyển khoản · Chờ BTC đối soát</strong><p>Giá gốc: {payment.base.toLocaleString("vi-VN")}đ · Giảm: {payment.discount.toLocaleString("vi-VN")}đ<br />Số tiền: {payment.amount.toLocaleString("vi-VN")}đ<br />Mã giảm giá: {payment.discount_code || "Không dùng"}<br />Nội dung: {payment.memo}</p>{proposal.receipt_url && <a href={proposal.receipt_url} target="_blank" rel="noopener noreferrer"><Image src={proposal.receipt_url} unoptimized width={240} height={240} alt="Ảnh chuyển khoản do chủ gian hàng cung cấp" style={{ objectFit: "contain" }} /></a>}<p>Kiểm tra giao dịch ngân hàng trước khi xác nhận. Nếu chuyển gian, cần đối soát lại theo thông tin thanh toán gốc này.</p></section>;
}
