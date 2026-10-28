import HeritageJourney from "./components/heritage-journey";
import "./event-program.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HeritageJourney />;
}
