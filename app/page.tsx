import HeritageJourney from "./components/heritage-journey";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HeritageJourney />;
}
