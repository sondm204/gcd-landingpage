// Set SITE_URL to the public production origin before building a deployment.
export const siteUrl = new URL(
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://gcd-landingpage.vercel.app",
);

export const siteTitle = "Global Citizens Day 2026 | Vietnam Roots, Global Mind";
export const siteDescription = "Hiểu về cội nguồn – Vững vàng bản lĩnh – Khai mở tư duy toàn cầu – Chủ động kiến tạo tương lai. Khám phá hội chợ, diễn đàn, Public Speaking, Debating và Heritage Talk.";
