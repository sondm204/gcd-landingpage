// Set SITE_URL to the public production origin before building a deployment.
export const siteUrl = new URL(
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://gcd-landingpage.vercel.app",
);

export const siteTitle = "Global Citizens Day 2026 | The Heritage Odyssey";
export const siteDescription = "Vietnam Roots – Global Minds. Hẹn bạn ngày 29/11/2026 tại Học viện Thanh thiếu niên Việt Nam, Hà Nội. Hành trình hiểu cội nguồn, vững bản lĩnh, khai mở tư duy toàn cầu và kiến tạo tương lai.";
