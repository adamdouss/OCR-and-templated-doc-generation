import "server-only";

import { ZodError } from "zod";

import { getMistralClient } from "@/lib/mistral";
import { DevisFournisseurSchema, type DevisFournisseur } from "@/lib/schemas";

const MODELE_EXTRACTION = "mistral-small-latest";

const PROMPT_SYSTEME_EXTRACTION = `
You are an information extraction assistant specialized in supplier quotes.

Extract structured supplier quote data from the OCR text provided by the user.

Return only valid JSON.
Do not include explanations.
Do not include Markdown.
If a field is missing, return null.
For numeric amounts, return numbers only, without currency symbols.

The document is expected to be a supplier quote or estimate, not an invoice.

Extract these structured fields when available:
- supplier name
- client name
- quote number
- quote date
- quote validity
- total before tax
- VAT rate in percent
- VAT amount
- total including tax
- payment terms
- regulatory notes
- warranty
- free summary
- line items

For VAT rate, return only the numeric value, for example 20 for 20%.
`.trim();

const MARQUEURS_DEVIS_FOURNISSEUR = [
  "devis",
  "quote",
  "estimate",
  "validite du devis",
];

type CodeErreurExtraction =
  | "MISSING_OCR_TEXT"
  | "UNSUPPORTED_DOCUMENT_TYPE"
  | "EMPTY_LLM_RESPONSE"
  | "INVALID_JSON"
  | "SCHEMA_VALIDATION_FAILED"
  | "MISTRAL_API_ERROR";

export class ExtractionError extends Error {
  readonly code: CodeErreurExtraction;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: CodeErreurExtraction,
    message: string,
    options?: {
      cause?: unknown;
      details?: unknown;
      status?: number;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ExtractionError";
    this.code = code;
    this.details = options?.details;
    this.status = options?.status ?? 500;
  }
}

type AnalyseurChat = {
  parse: (request: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat: typeof DevisFournisseurSchema;
  }) => Promise<{
    choices?: Array<{
      message?: {
        content?: string | null | Array<unknown>;
      } | null;
    }>;
  }>;
};

function normaliserTextePourDetection(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function extraireContenuAssistant(
  reponse: Awaited<ReturnType<AnalyseurChat["parse"]>>,
): string {
  const contenu = reponse.choices?.[0]?.message?.content;

  if (!contenu || Array.isArray(contenu)) {
    throw new ExtractionError(
      "EMPTY_LLM_RESPONSE",
      "La reponse du modele d'extraction est vide.",
      { status: 502 },
    );
  }

  return contenu;
}

export function ressembleAUnDevisFournisseur(texteOcr: string): boolean {
  const texteNormalise = normaliserTextePourDetection(texteOcr);
  return MARQUEURS_DEVIS_FOURNISSEUR.some((marqueur) =>
    texteNormalise.includes(marqueur),
  );
}

function normaliserTexteLibre(texte: string | null | undefined): string | null {
  if (!texte) {
    return null;
  }

  return texte.replace(/Acompt\S*\s+de\s+(\d+)\s*%/giu, "Acompte de $1 %")
    .replace(/\s+%/g, " %")
    .trim();
}

function construireResumeDevis(devis: DevisFournisseur): string | null {
  const resumeExistant = normaliserTexteLibre(devis.resume);
  if (resumeExistant) {
    return resumeExistant;
  }

  const segments: string[] = [];

  if (devis.nomFournisseur) {
    segments.push(`Devis emis par ${devis.nomFournisseur}.`);
  }

  if (devis.lignes.length > 0) {
    const descriptions = devis.lignes
      .map((ligne) => ligne.description.trim())
      .filter((description) => description.length > 0)
      .slice(0, 3);

    if (descriptions.length > 0) {
      segments.push(
        descriptions.length === 1
          ? `Prestation prevue : ${descriptions[0]}.`
          : `Prestations prevues : ${descriptions.join(", ")}.`,
      );
    }
  }

  if (devis.montantTotalHT != null && devis.montantTotalTTC != null) {
    segments.push(
      `Montant estime : ${devis.montantTotalHT} HT pour ${devis.montantTotalTTC} TTC.`,
    );
  } else if (devis.montantTotalTTC != null) {
    segments.push(`Montant total estime TTC : ${devis.montantTotalTTC}.`);
  }

  const conditionsPaiement = normaliserTexteLibre(devis.paymentTerms);
  if (conditionsPaiement) {
    segments.push(
      `Conditions de paiement : ${
        conditionsPaiement.endsWith(".")
          ? conditionsPaiement.slice(0, -1)
          : conditionsPaiement
      }.`,
    );
  }

  return segments.length > 0 ? segments.join(" ") : null;
}

function normaliserDevisFournisseur(
  devis: DevisFournisseur,
): DevisFournisseur {
  return {
    ...devis,
    resume: construireResumeDevis(devis),
    paymentTerms: normaliserTexteLibre(devis.paymentTerms),
    regulatoryNotes: normaliserTexteLibre(devis.regulatoryNotes),
    warranty: normaliserTexteLibre(devis.warranty),
  };
}

export function parserDevisFournisseurDepuisMessageChat(
  contenu: string,
): DevisFournisseur {
  let chargeUtile: unknown;

  try {
    chargeUtile = JSON.parse(contenu);
  } catch (error) {
    throw new ExtractionError(
      "INVALID_JSON",
      "Le modele a renvoye un JSON invalide.",
      { cause: error, status: 502 },
    );
  }

  try {
    return normaliserDevisFournisseur(DevisFournisseurSchema.parse(chargeUtile));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ExtractionError(
        "SCHEMA_VALIDATION_FAILED",
        "Les donnees extraites ne respectent pas le schema devis.",
        { cause: error, details: error.flatten(), status: 422 },
      );
    }

    throw error;
  }
}

export async function extraireDonneesDevisFournisseur(
  texteOcr: string,
  analyseur?: AnalyseurChat,
): Promise<DevisFournisseur> {
  const texteOcrNettoye = texteOcr.trim();

  if (!texteOcrNettoye) {
    throw new ExtractionError("MISSING_OCR_TEXT", "Le texte OCR est absent.", {
      status: 400,
    });
  }

  if (!ressembleAUnDevisFournisseur(texteOcrNettoye)) {
    throw new ExtractionError(
      "UNSUPPORTED_DOCUMENT_TYPE",
      "Le document ne ressemble pas a un devis fournisseur.",
      { status: 422 },
    );
  }

  const analyseurActif = analyseur ?? getMistralClient().chat;
  let reponse: Awaited<ReturnType<AnalyseurChat["parse"]>>;

  try {
    reponse = await analyseurActif.parse({
      model: MODELE_EXTRACTION,
      messages: [
        { role: "system", content: PROMPT_SYSTEME_EXTRACTION },
        { role: "user", content: texteOcrNettoye },
      ],
      responseFormat: DevisFournisseurSchema,
    });
  } catch (error) {
    throw new ExtractionError(
      "MISTRAL_API_ERROR",
      "L'appel a Mistral pour l'extraction a echoue.",
      { cause: error, status: 502 },
    );
  }

  return parserDevisFournisseurDepuisMessageChat(
    extraireContenuAssistant(reponse),
  );
}
