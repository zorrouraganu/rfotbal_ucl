import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { devLoginAction } from "@/app/test-login/actions";
import { demoPlayers } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export default function TestLoginPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="login-page">
      <section className="login-card test-login-card">
        <BrandMark />
        <p className="eyebrow">LOCAL TEST HARNESS</p><h1>Jucător test</h1>
        <div className="test-user-list">{demoPlayers.map((player) => <form action={devLoginAction} key={player.redditUsername}><input type="hidden" name="username" value={player.redditUsername} /><button><strong>u/{player.redditUsername}</strong><span>{player.nickname}{player.redditUsername === "satibagipula" ? " · admin" : ""}</span></button></form>)}</div>
      </section>
    </main>
  );
}
