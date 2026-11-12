import "./game.css";
import type { Metadata } from "next";
import GameLobby from "./components/game-lobby";

const title = "Hộ chiếu Di sản — Global Citizens Day 2026";
const description = "Năm chặng chơi, năm dấu ấn Việt. Khám phá làng nghề, tranh Đông Hồ, âm nhạc và những miền di sản trong Hộ chiếu Di sản.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/game" },
  openGraph: {
    title, description, url: "/game", type: "website", locale: "vi_VN",
    images: [{ url: "/opengraph-image?v=heritage-odyssey", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/twitter-image?v=heritage-odyssey"] },
};

export default function GamePage() {
  return <GameLobby />;
}
