import { describe, expect, it } from "vitest";

import { DevisFournisseurSchema } from "@/lib/schemas";

describe("DevisFournisseurSchema", () => {
  it("accepte un devis fournisseur valide", () => {
    const resultat = DevisFournisseurSchema.safeParse({
      nomFournisseur: "ACME Fournitures",
      nomClient: "Concordia",
      numeroDevis: "DEV-2026-001",
      dateDevis: "2026-05-10",
      validiteDevis: "30 jours",
      montantTotalHT: 100,
      montantTotalTTC: 120,
      devise: "EUR",
      lignes: [
        {
          description: "Papier A4",
          quantite: 10,
          prixUnitaire: 10,
          totalLigne: 100,
        },
      ],
      resume: "Fournitures de bureau.",
    });

    expect(resultat.success).toBe(true);
  });

  it("rejette un devis fournisseur invalide", () => {
    const resultat = DevisFournisseurSchema.safeParse({
      nomFournisseur: "",
      montantTotalHT: "100",
      lignes: [{ description: "" }],
    });

    expect(resultat.success).toBe(false);
  });
});
