export default function Home() {
  const backlog = [
    "Configurer les routes API OCR, extraction et generation DOCX",
    "Definir le schema facture avec Zod",
    "Brancher le SDK officiel Mistral cote serveur",
    "Ajouter la previsualisation editable des donnees extraites",
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-10 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-border bg-surface p-8 shadow-[0_30px_80px_rgba(78,55,33,0.08)] lg:grid-cols-[1.35fr_0.85fr] lg:p-10">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-accent/20 bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
            MVP en cours de construction
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              OCR-to-Report pour factures fournisseurs
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              Le socle technique est pret. La prochaine etape est de brancher le
              pipeline serveur pour transformer un PDF unique en donnees
              structurees valides, puis en document DOCX telechargeable.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Next.js 16
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              TypeScript strict
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Tailwind v4
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              UI en francais
            </span>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,243,227,0.95))] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Prochaines taches
          </p>
          <ol className="mt-5 space-y-4">
            {backlog.map((item, index) => (
              <li
                key={item}
                className="flex gap-4 rounded-2xl border border-white/70 bg-white/80 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-foreground">{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium text-muted">Route OCR</p>
          <h2 className="mt-3 text-xl font-semibold">PDF vers texte</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Upload unique en `FormData`, validation du type PDF, appel a
            `mistral-ocr-latest`, normalisation de la reponse et erreurs lisibles.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium text-muted">Extraction</p>
          <h2 className="mt-3 text-xl font-semibold">Texte vers JSON metier</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Prompt structure en francais, sortie JSON stricte, validation Zod et
            remontee d erreurs metier exploitables par l interface.
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium text-muted">Generation DOCX</p>
          <h2 className="mt-3 text-xl font-semibold">JSON vers livrable</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Template Word simple, injection des champs facture et telechargement
            du rapport final depuis le navigateur.
          </p>
        </article>
      </section>
    </main>
  );
}
