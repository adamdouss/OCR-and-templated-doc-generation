import { describe, expect, it } from "vitest";

import { DocxError, genererBonCommandeDocx } from "@/lib/docx";

describe("genererBonCommandeDocx", () => {
  it("genere un fichier docx a partir d'un devis mocke", async () => {
    const resultat = await genererBonCommandeDocx({
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

    expect(resultat.nomFichier).toBe("bon-commande-DEV-2026-001.docx");
    expect(resultat.buffer.length).toBeGreaterThan(0);
    expect(resultat.buffer.subarray(0, 2).toString()).toBe("PK");
  });

  it("rejette les donnees invalides", async () => {
    await expect(
      genererBonCommandeDocx({
        nomFournisseur: "",
        devise: "EUR",
        lignes: [],
      } as never),
    ).rejects.toBeInstanceOf(DocxError);
  });
});
