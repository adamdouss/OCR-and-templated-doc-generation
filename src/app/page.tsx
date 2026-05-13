"use client";

// Main UI orchestrator: upload one PDF, run OCR and extraction, allow edits,
// then trigger DOCX generation from the validated quote data.
import { useState } from "react";

import { ExtractionPreview } from "@/components/ExtractionPreview";
import {
  StatusStepper,
  type EtapePipeline,
} from "@/components/StatusStepper";
import { UploadZone } from "@/components/UploadZone";
import type { DevisFournisseur } from "@/lib/schemas";

const DEVIS_VIDE: DevisFournisseur = {
  nomFournisseur: "",
  nomClient: null,
  numeroDevis: null,
  dateDevis: null,
  validiteDevis: null,
  montantTotalHT: null,
  vatRate: null,
  vatAmount: null,
  montantTotalTTC: null,
  devise: "EUR",
  lignes: [],
  resume: null,
  paymentTerms: null,
  regulatoryNotes: null,
  warranty: null,
};

// Converts any thrown error into a user-facing message without leaking
// implementation details into the UI.
function extraireMessageErreur(
  erreur: unknown,
  messageParDefaut: string,
): string {
  if (erreur instanceof Error && erreur.message) {
    return erreur.message;
  }

  return messageParDefaut;
}

// Shared fetch helper used by the page-level workflow. It centralizes API
// error handling so each step only deals with its typed payload.
async function verifierReponseJson<T>(
  reponse: Response,
  messageParDefaut: string,
): Promise<T> {
  const donnees = (await reponse.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  if (!reponse.ok) {
    const messageErreur =
      donnees && typeof donnees === "object" && "error" in donnees
        ? donnees.error
        : messageParDefaut;

    throw new Error(messageErreur ?? messageParDefaut);
  }

  return donnees as T;
}

export default function Home() {
  // Page-level state is enough for this MVP because we only handle one file
  // and one quote at a time. A global store would be unnecessary here.
  const [fichierSelectionne, setFichierSelectionne] = useState<File | null>(
    null,
  );
  const [etape, setEtape] = useState<EtapePipeline>("idle");
  const [texteOcr, setTexteOcr] = useState("");
  const [devis, setDevis] = useState<DevisFournisseur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nomFichierGenere, setNomFichierGenere] = useState<string | null>(null);

  const interfaceVerrouillee =
    etape === "uploading" ||
    etape === "ocr" ||
    etape === "extracting" ||
    etape === "generating";

  const reinitialiserSorties = () => {
    // Any file change resets downstream artifacts so the UI never mixes the
    // OCR/output of one document with another.
    setEtape("idle");
    setErreur(null);
    setTexteOcr("");
    setDevis(null);
    setNomFichierGenere(null);
  };

  const gererChangementFichier = (file: File | null) => {
    reinitialiserSorties();

    if (!file) {
      setFichierSelectionne(null);
      return;
    }

    const estPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!estPdf) {
      setFichierSelectionne(null);
      setErreur("Veuillez selectionner un document PDF valide.");
      setEtape("error");
      return;
    }

    setFichierSelectionne(file);
  };

  const lancerAnalyse = async () => {
    if (!fichierSelectionne) {
      setErreur("Selectionnez d'abord un fichier PDF.");
      setEtape("error");
      return;
    }

    const estPdf =
      fichierSelectionne.type === "application/pdf" ||
      fichierSelectionne.name.toLowerCase().endsWith(".pdf");

    if (!estPdf) {
      setErreur("Le fichier choisi doit etre un PDF.");
      setEtape("error");
      return;
    }

    try {
      setErreur(null);
      setNomFichierGenere(null);
      setEtape("uploading");

      // OCR and extraction remain two separate HTTP calls on purpose:
      // it keeps failures visible and each backend step independently testable.
      const formData = new FormData();
      formData.append("file", fichierSelectionne);

      setEtape("ocr");
      const ocrResponse = await fetch("/api/ocr", {
        body: formData,
        method: "POST",
      });
      const ocrPayload = await verifierReponseJson<{ text: string }>(
        ocrResponse,
        "Le traitement OCR a echoue.",
      );

      setTexteOcr(ocrPayload.text);
      setEtape("extracting");

      const extractResponse = await fetch("/api/extract", {
        body: JSON.stringify({ texteOcr: ocrPayload.text }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const extractPayload = await verifierReponseJson<{
        devis: DevisFournisseur;
      }>(extractResponse, "L'extraction des donnees a echoue.");

      // We merge against DEVIS_VIDE so optional fields are always present with
      // a stable shape in the editor, even if the backend omitted some values.
      setDevis({
        ...DEVIS_VIDE,
        ...extractPayload.devis,
        lignes: extractPayload.devis.lignes ?? [],
      });
      setEtape("ready");
    } catch (error) {
      setErreur(
        extraireMessageErreur(
          error,
          "Une erreur est survenue pendant l'analyse du devis.",
        ),
      );
      setEtape("error");
    }
  };

  const genererDocx = async () => {
    if (!devis) {
      setErreur("Aucun devis n'est disponible pour la generation DOCX.");
      setEtape("error");
      return;
    }

    try {
      setErreur(null);
      setEtape("generating");

      const response = await fetch("/api/generate-docx", {
        body: JSON.stringify({ devis }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(
          payload?.error ??
            "La generation du bon de commande a echoue.",
        );
      }

      const blob = await response.blob();
      const contenuDisposition = response.headers.get("content-disposition");
      const nomFichier =
        contenuDisposition?.match(/filename="([^"]+)"/)?.[1] ??
        "bon-commande.docx";

      // Browser download is handled client-side so the route can stay focused
      // on returning a valid DOCX payload with the right headers.
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = nomFichier;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);

      setNomFichierGenere(nomFichier);
      setEtape("done");
    } catch (error) {
      setErreur(
        extraireMessageErreur(
          error,
          "La generation du bon de commande a echoue.",
        ),
      );
      setEtape("error");
    }
  };

  return (
    // The page is split into four user-facing blocks:
    // 1. context/header,
    // 2. pipeline state,
    // 3. editable quote data,
    // 4. OCR raw text and usage hints.
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 lg:px-10 lg:py-10">
      <section className="grid gap-6 rounded-[2rem] border border-border bg-surface p-8 shadow-[0_30px_80px_rgba(78,55,33,0.08)] lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-accent/20 bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
            MVP OCR-to-Report
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Devis fournisseur vers bon de commande client
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted">
              Uploadez un PDF, lancez l&apos;OCR Mistral, corrigez les donnees
              extraites, puis telechargez un bon de commande DOCX pret a etre
              partage.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Mistral OCR
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Extraction structuree
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Correction manuelle
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-2">
              Export DOCX
            </span>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,243,227,0.95))] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Resume session
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <dt className="font-medium text-muted">Fichier selectionne</dt>
              <dd className="mt-2 text-base text-foreground">
                {fichierSelectionne?.name ?? "Aucun PDF"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <dt className="font-medium text-muted">Texte OCR</dt>
              <dd className="mt-2 text-base text-foreground">
                {texteOcr ? `${texteOcr.length} caracteres` : "Pas encore lance"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <dt className="font-medium text-muted">Sortie generee</dt>
              <dd className="mt-2 text-base text-foreground">
                {nomFichierGenere ?? "Aucun DOCX telecharge"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <StatusStepper etape={etape} />

      <UploadZone
        erreur={erreur}
        estOccupe={interfaceVerrouillee}
        fichierSelectionne={fichierSelectionne}
        onFileChange={gererChangementFichier}
      />

      <section className="grid gap-4 rounded-[1.75rem] border border-border bg-surface p-6 md:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Pilotage
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Lancer l&apos;analyse ou exporter le resultat
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Le premier bouton lance l&apos;OCR puis l&apos;extraction. Une fois
            le devis revu, le second bouton genere le bon de commande DOCX.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
          <button
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!fichierSelectionne || interfaceVerrouillee}
            onClick={lancerAnalyse}
            type="button"
          >
            {interfaceVerrouillee && etape !== "generating"
              ? "Analyse en cours..."
              : "Lancer l'analyse"}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!devis || interfaceVerrouillee}
            onClick={genererDocx}
            type="button"
          >
            {etape === "generating"
              ? "Generation en cours..."
              : "Generer le bon de commande"}
          </button>
        </div>
      </section>

      {devis ? (
        <ExtractionPreview
          devis={devis}
          estVerrouille={interfaceVerrouillee}
          onChange={setDevis}
        />
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-border bg-white/70 px-6 py-10 text-center">
          <p className="text-lg font-medium text-foreground">
            Aucune donnee extraite pour le moment.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Selectionnez un PDF puis lancez l&apos;analyse pour afficher le
            devis editable ici.
          </p>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.5rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
            Apercu OCR
          </p>
          <textarea
            className="mt-4 min-h-64 w-full rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm leading-7 text-foreground outline-none"
            readOnly
            value={texteOcr}
          />
        </article>

        <article className="rounded-[1.5rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
            Aide d&apos;usage
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
            <p>
              Si un champ est mal extrait, corrigez-le directement dans le
              panneau principal avant l&apos;export.
            </p>
            <p>
              Les lignes de devis peuvent etre ajoutees, supprimees ou
              modifiees manuellement.
            </p>
            <p>
              Le DOCX est telecharge automatiquement a la fin de la generation.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
