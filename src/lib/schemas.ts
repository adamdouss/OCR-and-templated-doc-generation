// Central business contract shared by the UI, API routes, and document
// generation. Any extracted data must satisfy these Zod schemas.
import { z } from "zod";

export const LigneDevisFournisseurSchema = z.object({
  // Each line item stays lightweight on purpose: OCR often finds the label
  // reliably, while quantity and amounts may still need manual correction.
  description: z.string().trim().min(1, "La description de ligne est requise."),
  quantite: z.number().nullable().optional(),
  prixUnitaire: z.number().nullable().optional(),
  totalLigne: z.number().nullable().optional(),
});

export const DevisFournisseurSchema = z.object({
  // Required business anchor: without a supplier, the generated purchase order
  // is not meaningful enough to keep.
  nomFournisseur: z.string().trim().min(1, "Le fournisseur est requis."),
  // The rest of the fields are nullable because real quotes are inconsistent,
  // and the UI is expected to let the user complete missing information.
  nomClient: z.string().trim().nullable().optional(),
  numeroDevis: z.string().trim().nullable().optional(),
  dateDevis: z.string().trim().nullable().optional(),
  validiteDevis: z.string().trim().nullable().optional(),
  montantTotalHT: z.number().nullable().optional(),
  vatRate: z.number().nullable().optional(),
  vatAmount: z.number().nullable().optional(),
  montantTotalTTC: z.number().nullable().optional(),
  devise: z.string().trim().min(1).default("EUR"),
  lignes: z.array(LigneDevisFournisseurSchema).default([]),
  resume: z.string().trim().nullable().optional(),
  paymentTerms: z.string().trim().nullable().optional(),
  regulatoryNotes: z.string().trim().nullable().optional(),
  warranty: z.string().trim().nullable().optional(),
});

export const RequeteExtractionDevisSchema = z.object({
  texteOcr: z.string().trim().min(1, "Le texte OCR est requis."),
});

export type LigneDevisFournisseur = z.infer<typeof LigneDevisFournisseurSchema>;
export type DevisFournisseur = z.infer<typeof DevisFournisseurSchema>;
export type RequeteExtractionDevis = z.infer<
  typeof RequeteExtractionDevisSchema
>;
