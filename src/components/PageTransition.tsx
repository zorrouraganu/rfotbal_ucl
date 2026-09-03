import { ViewTransition } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ default: "none", "player-tab": "player-page" }}
      exit={{ default: "none", "player-tab": "player-page" }}
      default="none"
    >
      <div className="player-page">{children}</div>
    </ViewTransition>
  );
}
