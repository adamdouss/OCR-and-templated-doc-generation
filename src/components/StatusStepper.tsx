"use client";

export type EtapePipeline =
  | "idle"
  | "uploading"
  | "ocr"
  | "extracting"
  | "ready"
  | "generating"
  | "done"
  | "error";

type StatusStepperProps = {
  etape: EtapePipeline;
};

const ORDRE_ETAPES: Array<{
  cle: Exclude<EtapePipeline, "idle" | "error" | "done">;
  etiquette: string;
  description: string;
}> = [
  {
    cle: "uploading",
    etiquette: "Upload",
    description: "Transmission du PDF au serveur.",
  },
  {
    cle: "ocr",
    etiquette: "OCR",
    description: "Lecture du document via Mistral OCR.",
  },
  {
    cle: "extracting",
    etiquette: "Extraction",
    description: "Structuration du devis avec validation metier.",
  },
  {
    cle: "ready",
    etiquette: "Revision",
    description: "Controle et correction des donnees extraites.",
  },
  {
    cle: "generating",
    etiquette: "DOCX",
    description: "Generation du bon de commande telechargeable.",
  },
];

function obtenirEtatVisuel(
  etapeCourante: EtapePipeline,
  index: number,
): "done" | "current" | "pending" | "error" {
  if (etapeCourante === "error") {
    return index === 0 ? "error" : "pending";
  }

  if (etapeCourante === "idle") {
    return "pending";
  }

  if (etapeCourante === "done") {
    return "done";
  }

  const indexCourant = ORDRE_ETAPES.findIndex(({ cle }) => cle === etapeCourante);

  if (index < indexCourant) {
    return "done";
  }

  if (index === indexCourant) {
    return "current";
  }

  return "pending";
}

export function StatusStepper({ etape }: StatusStepperProps) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-surface p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Avancement
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Pipeline de traitement
          </h2>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          Etat actuel:{" "}
          <span className="font-medium text-foreground">
            {etape === "idle" ? "en attente" : etape}
          </span>
        </p>
      </div>

      <ol className="mt-6 grid gap-4 lg:grid-cols-5">
        {ORDRE_ETAPES.map((item, index) => {
          const etatVisuel = obtenirEtatVisuel(etape, index);
          const classesEtat =
            etatVisuel === "done"
              ? "border-accent bg-accent text-white"
              : etatVisuel === "current"
                ? "border-accent bg-accent-soft text-accent"
                : etatVisuel === "error"
                  ? "border-[#d18b72] bg-[#fff3ed] text-[#8f3b19]"
                  : "border-border bg-white text-muted";

          return (
            <li
              key={item.cle}
              className="rounded-[1.25rem] border border-border/80 bg-white/75 p-4"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${classesEtat}`}
              >
                {etatVisuel === "done" ? "✓" : index + 1}
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                {item.etiquette}
              </p>
              <p className="mt-2 text-base font-medium text-foreground">
                {item.description}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
