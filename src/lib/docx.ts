import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import createReport from "docx-templates";
import { ZodError } from "zod";

import { formatCurrency } from "@/lib/formatCurrency";
import { DevisFournisseurSchema, type DevisFournisseur } from "@/lib/schemas";

const CHEMIN_TEMPLATE_BON_COMMANDE = path.join(
  process.cwd(),
  "templates",
  "purchase-order-template.docx",
);

const TEXTE_NON_SPECIFIE = "Non spécifié";

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

function formatPercentage(value: number | null | undefined): string {
  if (value == null) {
    return "";
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function normaliserTexteLibre(texte: string | null | undefined): string {
  if (!texte) {
    return "";
  }

  return texte.replace(/Acompt\S*\s+de\s+(\d+)\s*%/giu, "Acompte de $1 %")
    .replace(/\s+%/g, " %")
    .trim();
}

function texteOuNonSpecifie(texte: string | null | undefined): string {
  const texteNormalise = normaliserTexteLibre(texte);
  return texteNormalise.length > 0 ? texteNormalise : TEXTE_NON_SPECIFIE;
}

function montantOuNonSpecifie(
  valeur: number | null | undefined,
  devise: string,
): string {
  return valeur == null ? TEXTE_NON_SPECIFIE : formatCurrency(valeur, devise);
}

function construireDonneesTemplate(devis: DevisFournisseur) {
  const devise = devis.devise;
  const lignes =
    devis.lignes.length > 0
      ? devis.lignes.map((ligne) => ({
          ...ligne,
          descriptionAffiche:
            ligne.description.trim() || TEXTE_NON_SPECIFIE,
          quantiteAffiche:
            ligne.quantite == null ? TEXTE_NON_SPECIFIE : String(ligne.quantite),
          prixUnitaireFormate: montantOuNonSpecifie(ligne.prixUnitaire, devise),
          totalLigneFormate: montantOuNonSpecifie(ligne.totalLigne, devise),
        }))
      : [
          {
            description: "",
            quantite: null,
            prixUnitaire: null,
            totalLigne: null,
            descriptionAffiche: TEXTE_NON_SPECIFIE,
            quantiteAffiche: TEXTE_NON_SPECIFIE,
            prixUnitaireFormate: TEXTE_NON_SPECIFIE,
            totalLigneFormate: TEXTE_NON_SPECIFIE,
          },
        ];

  const tauxTvaFormate = formatPercentage(devis.vatRate);

  return {
    ...devis,
    nomClientAffiche: texteOuNonSpecifie(devis.nomClient),
    numeroDevisAffiche: texteOuNonSpecifie(devis.numeroDevis),
    dateDevisAffiche: texteOuNonSpecifie(devis.dateDevis),
    validiteDevisAffiche: texteOuNonSpecifie(devis.validiteDevis),
    resumeAffiche: texteOuNonSpecifie(devis.resume),
    paymentTermsAffiche: texteOuNonSpecifie(devis.paymentTerms),
    regulatoryNotesAffiche: texteOuNonSpecifie(devis.regulatoryNotes),
    warrantyAffiche: texteOuNonSpecifie(devis.warranty),
    montantTotalHTFormate: montantOuNonSpecifie(devis.montantTotalHT, devise),
    tauxTvaFormate,
    tvaLibelle: tauxTvaFormate ? `TVA ${tauxTvaFormate} %` : "TVA",
    montantTvaFormate: montantOuNonSpecifie(devis.vatAmount, devise),
    montantTotalTTCFormate: montantOuNonSpecifie(devis.montantTotalTTC, devise),
    lignes,
  };
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
      data: construireDonneesTemplate(devisValide),
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
