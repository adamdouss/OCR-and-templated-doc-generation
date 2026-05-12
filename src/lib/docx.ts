import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import createReport from "docx-templates";
import { ZodError } from "zod";

import { DevisFournisseurSchema, type DevisFournisseur } from "@/lib/schemas";

const CHEMIN_TEMPLATE_BON_COMMANDE = path.join(
  process.cwd(),
  "templates",
  "purchase-order-template.docx",
);

type CodeErreurDocx =
  | "INVALID_DATA"
  | "TEMPLATE_NOT_FOUND"
  | "DOCX_GENERATION_FAILED";

export class DocxError extends Error {
  readonly code: CodeErreurDocx;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: CodeErreurDocx,
    message: string,
    options?: {
      cause?: unknown;
      details?: unknown;
      status?: number;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "DocxError";
    this.code = code;
    this.status = options?.status ?? 500;
    this.details = options?.details;
  }
}

function construireNomFichierBonCommande(
  numeroDevis?: string | null,
): string {
  const suffixe = (numeroDevis ?? "sans-reference")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `bon-commande-${suffixe || "sans-reference"}.docx`;
}

async function lireTemplateBonCommande(
  cheminTemplate: string = CHEMIN_TEMPLATE_BON_COMMANDE,
): Promise<Buffer> {
  try {
    return await readFile(cheminTemplate);
  } catch (error) {
    throw new DocxError(
      "TEMPLATE_NOT_FOUND",
      "Le template DOCX du bon de commande est introuvable.",
      {
        cause: error,
        details: { cheminTemplate },
        status: 500,
      },
    );
  }
}

export async function genererBonCommandeDocx(
  devis: DevisFournisseur,
  cheminTemplate?: string,
): Promise<{ buffer: Buffer; nomFichier: string }> {
  let devisValide: DevisFournisseur;

  try {
    devisValide = DevisFournisseurSchema.parse(devis);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new DocxError(
        "INVALID_DATA",
        "Les donnees du devis sont invalides pour la generation du bon de commande.",
        { cause: error, details: error.flatten(), status: 400 },
      );
    }

    throw error;
  }

  const template = await lireTemplateBonCommande(cheminTemplate);

  try {
    const rapport = await createReport({
      template,
      data: devisValide,
      processLineBreaks: true,
    });

    return {
      buffer: Buffer.from(rapport),
      nomFichier: construireNomFichierBonCommande(devisValide.numeroDevis),
    };
  } catch (error) {
    throw new DocxError(
      "DOCX_GENERATION_FAILED",
      "La generation du bon de commande a echoue.",
      { cause: error, status: 500 },
    );
  }
}
