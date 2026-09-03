"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="center-state"><h1>Semnal pierdut</h1><p>Nu am putut încărca datele competiției.</p><button className="button button-primary" onClick={reset}>Încearcă din nou</button></main>;
}
