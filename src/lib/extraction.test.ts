import { describe, expect, it, vi } from "vitest";

import {
  ExtractionError,
  extraireDonneesDevisFournisseur,
  parserDevisFournisseurDepuisMessageChat,
  ressembleAUnDevisFournisseur,
} from "@/lib/extraction";

describe("parserDevisFournisseurDepuisMessageChat", () => {
  it("parse un JSON valide en devis fournisseur", () => {
    const devis = parserDevisFournisseurDepuisMessageChat(`
      {
        "nomFournisseur": "ACME Fournitures",
        "nomClient": "Concordia",
        "numeroDevis": "DEV-2026-001",
        "dateDevis": "2026-05-10",
        "validiteDevis": "30 jours",
        "montantTotalHT": 100,
        "vatRate": 20,
        "vatAmount": 20,
        "montantTotalTTC": 120,
        "devise": "EUR",
        "lignes": [],
        "resume": "Acompté de 30% a la commande",
        "paymentTerms": "Acompté de 30% a la commande",
        "regulatoryNotes": "Norme NF C 15-100",
        "warranty": "Garantie 2 ans"
      }
    `);

    expect(devis.nomFournisseur).toBe("ACME Fournitures");
    expect(devis.montantTotalTTC).toBe(120);
    expect(devis.vatRate).toBe(20);
    expect(devis.resume).toBe("Acompte de 30 % a la commande");
  });

  it("leve une erreur propre pour un JSON invalide", () => {
    expect(() =>
      parserDevisFournisseurDepuisMessageChat("{invalid-json"),
    ).toThrowError(ExtractionError);

    try {
      parserDevisFournisseurDepuisMessageChat("{invalid-json");
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError);
      expect((error as ExtractionError).code).toBe("INVALID_JSON");
    }
  });

  it("leve une erreur propre pour un schema invalide", () => {
    expect(() =>
      parserDevisFournisseurDepuisMessageChat(`
        {
          "nomFournisseur": "",
          "nomClient": null,
          "numeroDevis": null,
          "dateDevis": null,
          "validiteDevis": null,
          "montantTotalHT": null,
          "vatRate": null,
          "vatAmount": null,
          "montantTotalTTC": null,
          "devise": "EUR",
          "lignes": [],
          "resume": null,
          "paymentTerms": null,
          "regulatoryNotes": null,
          "warranty": null
        }
      `),
    ).toThrowError(ExtractionError);

    try {
      parserDevisFournisseurDepuisMessageChat(`
        {
          "nomFournisseur": "",
          "nomClient": null,
          "numeroDevis": null,
          "dateDevis": null,
          "validiteDevis": null,
          "montantTotalHT": null,
          "vatRate": null,
          "vatAmount": null,
          "montantTotalTTC": null,
          "devise": "EUR",
          "lignes": [],
          "resume": null,
          "paymentTerms": null,
          "regulatoryNotes": null,
          "warranty": null
        }
      `);
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError);
      expect((error as ExtractionError).code).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });
});

describe("ressembleAUnDevisFournisseur", () => {
  it("detecte les marqueurs de devis dans le texte OCR", () => {
    expect(
      ressembleAUnDevisFournisseur("DEVIS\nValidité du devis : 1 mois"),
    ).toBe(true);
  });

  it("reste robuste aux accents", () => {
    expect(
      ressembleAUnDevisFournisseur("DEVIS\nValidite du devis : 1 mois"),
    ).toBe(true);
  });

  it("rejette un texte sans marqueurs de devis", () => {
    expect(
      ressembleAUnDevisFournisseur(
        "FACTURE\nDate : 2026-05-10\nEcheance : 30 jours",
      ),
    ).toBe(false);
  });
});

describe("extraireDonneesDevisFournisseur", () => {
  it("utilise l'analyseur et renvoie un devis valide", async () => {
    const parse = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              nomFournisseur: "ACME Fournitures",
              nomClient: "Concordia",
              numeroDevis: "DEV-2026-001",
              dateDevis: "2026-05-10",
              validiteDevis: "30 jours",
              montantTotalHT: 100,
              vatRate: 20,
              vatAmount: 20,
              montantTotalTTC: 120,
              devise: "EUR",
              lignes: [],
              resume: "Devis de test",
              paymentTerms: "Acompte de 30 % a la commande",
              regulatoryNotes: "Norme NF C 15-100",
              warranty: "Garantie 2 ans",
            }),
          },
        },
      ],
    });

    const devis = await extraireDonneesDevisFournisseur("DEVIS\nOCR text", {
      parse,
    });

    expect(parse).toHaveBeenCalledOnce();
    expect(devis.nomFournisseur).toBe("ACME Fournitures");
  });

  it("genere un resume de secours quand le LLM le laisse vide", async () => {
    const parse = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              nomFournisseur: "ACME Fournitures",
              nomClient: "Concordia",
              numeroDevis: "DEV-2026-001",
              dateDevis: "2026-05-10",
              validiteDevis: "30 jours",
              montantTotalHT: 100,
              vatRate: 20,
              vatAmount: 20,
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
              resume: null,
              paymentTerms: "Acompte de 30 % a la commande",
              regulatoryNotes: null,
              warranty: null,
            }),
          },
        },
      ],
    });

    const devis = await extraireDonneesDevisFournisseur("DEVIS\nOCR text", {
      parse,
    });

    expect(devis.resume).toContain("Devis emis par ACME Fournitures.");
    expect(devis.resume).toContain("Prestation prevue : Papier A4.");
    expect(devis.resume).toContain("Montant estime : 100 HT pour 120 TTC.");
    expect(devis.resume).toContain(
      "Conditions de paiement : Acompte de 30 % a la commande.",
    );
  });

  it("rejette un texte OCR vide avant l'appel Mistral", async () => {
    const parse = vi.fn();

    await expect(
      extraireDonneesDevisFournisseur("   ", { parse }),
    ).rejects.toMatchObject({
      code: "MISSING_OCR_TEXT",
    });

    expect(parse).not.toHaveBeenCalled();
  });

  it("rejette un document hors perimetre avant l'appel Mistral", async () => {
    const parse = vi.fn();

    await expect(
      extraireDonneesDevisFournisseur("FACTURE\nPaiement sous 30 jours", {
        parse,
      }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_DOCUMENT_TYPE",
    });

    expect(parse).not.toHaveBeenCalled();
  });
});
