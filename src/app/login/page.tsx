import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentPlayer } from "@/lib/auth-server";

export const metadata = { title: "Autentificare" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentPlayer()) redirect("/account");
  const { error } = await searchParams;
  return (
    <main className="login-page">
      <div className="login-stars" aria-hidden="true" />
      <section className="login-card">
        <BrandMark />
        <div className="login-copy">
          <p className="eyebrow">Sezonul 2026–27 · Faza ligii</p>
          <h1>Predict the night.</h1>
        </div>
        <div className="login-markets">
          <div className="market-preview"><b>RISC</b><span>1</span><span>X</span><span>2</span><i>3 PCT</i></div>
          <div className="market-preview muted"><b>CONTROL</b><span>1X</span><span>X2</span><span>12</span><i>1 PCT</i></div>
        </div>
        {error && <p className="form-error">Autentificarea Reddit nu a putut fi finalizată. Încearcă din nou.</p>}
        <a className="reddit-button" href="/api/auth/reddit/start">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="8.5" cy="12.5" r="1.2" fill="#fff"/><circle cx="15.5" cy="12.5" r="1.2" fill="#fff"/><path d="M7 15c2.8 2 7.2 2 10 0" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Intră cu Reddit <span aria-hidden="true">→</span>
        </a>
        {process.env.NODE_ENV !== "production" && <Link href="/test-login" className="dev-link">Intrare rapidă pentru testare locală</Link>}
        <small className="privacy-note">Folosim doar identitatea Reddit. Nu citim postări, mesaje sau comunități.</small>
      </section>
    </main>
  );
}
