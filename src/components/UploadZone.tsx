"use client";

// Presentational upload block for the single-PDF MVP. It keeps file picking
// concerns isolated from the page-level workflow state.
import { useId } from "react";

type UploadZoneProps = {
  erreur?: string | null;
  fichierSelectionne: File | null;
  onFileChange: (file: File | null) => void;
  estOccupe?: boolean;
};

export function UploadZone({
  erreur,
  fichierSelectionne,
  onFileChange,
  estOccupe = false,
}: UploadZoneProps) {
  const inputId = useId();

  return (
    <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_60px_rgba(78,55,33,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Upload PDF
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Importer un devis fournisseur
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Selectionnez un seul PDF. Le fichier sera envoye au pipeline OCR,
            puis transforme en donnees structurees modifiables.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-accent/20 bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
          PDF unique
        </span>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-dashed border-accent/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,243,227,0.92))] px-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <label
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            htmlFor={inputId}
          >
            Choisir un PDF
          </label>
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {fichierSelectionne ? "Fichier charge" : "Aucun fichier"}
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-base font-medium text-foreground">
            {fichierSelectionne
              ? fichierSelectionne.name
              : "Selectionnez votre devis fournisseur au format PDF"}
          </p>
          <p className="text-sm text-muted">
            Format accepte: `.pdf`. Si vous rechargez le meme fichier, la
            selection sera relue correctement.
          </p>
        </div>

        <input
          id={inputId}
          accept="application/pdf,.pdf"
          className="mt-4 block w-full cursor-pointer rounded-[1rem] border border-border bg-white px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-surface-strong file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground"
          disabled={estOccupe}
          onClick={(event) => {
            event.currentTarget.value = "";
          }}
          onChange={(event) => {
            const prochainFichier = event.target.files?.[0] ?? null;
            onFileChange(prochainFichier);
          }}
          type="file"
        />
      </div>

      {erreur ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl border border-[#d18b72] bg-[#fff3ed] px-4 py-3 text-sm leading-6 text-[#8f3b19]"
          role="status"
        >
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
