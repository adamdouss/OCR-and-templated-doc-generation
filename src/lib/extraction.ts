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
    return DevisFournisseurSchema.parse(chargeUtile);
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
