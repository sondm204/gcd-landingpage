import GameAccess from "@/app/game/components/game-access";
export default function Layout({ children }: { children: React.ReactNode }) { return <GameAccess game="print">{children}</GameAccess>; }
