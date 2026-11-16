import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  // Shared Vietnamese links keep their meaning; explicit switches set the cookie.
  localeDetection: false,
});
