"use client";
import { useLocale } from "next-intl";
import { useCopy } from "@/i18n/copy";
import Image from "next/image";
import type { BoothProposal } from "@/lib/booths/types";
export default function BoothPaymentReview({ proposal }: { proposal: BoothProposal }) {
  const t = useCopy();
  const locale = useLocale();
  if (!proposal.payment) return null;
  const payment = proposal.payment;
  return <section className="booth-alert"><strong>{t("Thông tin chuyển khoản · Chờ BTC đối soát")}</strong><p>{t("Giá gốc:")} {payment.base.toLocaleString(locale)}{t("đ · Giảm:")} {payment.discount.toLocaleString(locale)}{t("đ")}<br />{t("Số tiền:")} {payment.amount.toLocaleString(locale)}{t("đ")}<br />{t("Mã giảm giá:")} {payment.discount_code || t("Không dùng")}<br />{t("Nội dung:")} {payment.memo}</p>{proposal.receipt_url && <a href={proposal.receipt_url} target="_blank" rel="noopener noreferrer"><Image src={proposal.receipt_url} unoptimized width={240} height={240} alt={t("Ảnh chuyển khoản do chủ gian hàng cung cấp")} style={{ objectFit: "contain" }} /></a>}<p>{t("Kiểm tra giao dịch ngân hàng trước khi xác nhận. Nếu chuyển gian, cần đối soát lại theo thông tin thanh toán gốc này.")}</p></section>;
}
