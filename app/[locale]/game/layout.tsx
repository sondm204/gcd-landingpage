import { GameSessionProvider } from "@/app/game/components/game-account";
import "@/app/game/account.css";
import "@/app/game/passport.css";
export default function GameLayout({ children }: { children: React.ReactNode }) { return <GameSessionProvider>{children}</GameSessionProvider>; }
