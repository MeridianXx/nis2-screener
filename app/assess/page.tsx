export default function AssessPage() {
  // TODO(session 3): Implement the 3-step manual assessment flow per PRD 4.2.
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mid">
        Manuell bedömning
      </p>
      <h1 className="mt-3 text-[34px] leading-tight text-ink">Kommer i nästa session</h1>
      <p className="mt-4 text-[15px] text-mid">
        3-stegsflödet (sektor, storlek, särskilda förhållanden) implementeras i kommande
        session. Tills dess används endast regelmotorn via API:et <code>/api/assess</code>.
      </p>
    </main>
  );
}
