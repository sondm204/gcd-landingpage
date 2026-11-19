import { GameSessionProvider } from "./components/game-account";
import "./account.css";
export default function GameLayout({ children }: { children: React.ReactNode }) { return <GameSessionProvider>{children}</GameSessionProvider>; }
