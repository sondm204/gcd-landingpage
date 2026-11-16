import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export default async function BoothAdminPage() { redirect({ href: "/booths", locale: await getLocale() }); }
