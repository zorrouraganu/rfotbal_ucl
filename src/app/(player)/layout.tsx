import { AppFrame } from "@/components/AppFrame";
import { requirePlayer } from "@/lib/auth-server";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const player = await requirePlayer();
  return <AppFrame player={player}>{children}</AppFrame>;
}
