"use client";

// Editable quote preview. This is intentionally a thin form over the extracted
// business object so the user can correct data before DOCX export.
import { formatCurrency } from "@/lib/formatCurrency";
import type {
  DevisFournisseur,
  LigneDevisFournisseur,
} from "@/lib/schemas";

type ExtractionPreviewProps = {
  devis: DevisFournisseur;
  estVerrouille?: boolean;
  onChange: (devis: DevisFournisseur) => void;
};

const GRILLE_LIGNES_DEVIS =
  "grid min-w-[860px] grid-cols-[minmax(260px,2.1fr)_minmax(110px,0.8fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_120px] items-start gap-3";

function convertirVersNombreOptionnel(valeur: string): number | null {
  const valeurNettoyee = valeur.trim().replace(",", ".");

  if (!valeurNettoyee) {
    return null;
  }

  const nombre = Number(valeurNettoyee);
  return Number.isFinite(nombre) ? nombre : null;
}

function convertirVersTexteOptionnel(valeur: string): string | null {
  const valeurNettoyee = valeur.trim();
  return valeurNettoyee ? valeurNettoyee : null;
}

// Small immutable update helper for line items, so the component can keep the
// state shape compatible with the Zod schema used on the server.
function mettreAJourLigne(
  lignes: LigneDevisFournisseur[],
  index: number,
  ligne: LigneDevisFournisseur,
): LigneDevisFournisseur[] {
  return lignes.map((ligneCourante, indexCourant) =>
    indexCourant === index ? ligne : ligneCourante,
  );
}

export function ExtractionPreview({
  devis,
  estVerrouille = false,
  onChange,
}: ExtractionPreviewProps) {
  const mettreAJourChampTexte = (
    cle: keyof Pick<
      DevisFournisseur,
      | "nomFournisseur"
      | "nomClient"
      | "numeroDevis"
      | "dateDevis"
      | "validiteDevis"
      | "devise"
      | "resume"
      | "paymentTerms"
      | "regulatoryNotes"
      | "warranty"
    >,
    valeur: string,
  ) => {
    const valeurFinale =
      cle === "nomFournisseur" || cle === "devise"
        ? valeur
        : convertirVersTexteOptionnel(valeur);

    onChange({
      ...devis,
      [cle]: valeurFinale,
    });
  };

  const mettreAJourChampNombre = (
    cle: keyof Pick<
      DevisFournisseur,
      "montantTotalHT" | "vatRate" | "vatAmount" | "montantTotalTTC"
    >,
    valeur: string,
  ) => {
    onChange({
      ...devis,
      [cle]: convertirVersNombreOptionnel(valeur),
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_60px_rgba(78,55,33,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Donnees extraites
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Revision manuelle du devis
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted">
          Corrigez les champs avant de generer le bon de commande. Les montants
          vides seront traites comme inconnus.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ChampTexte
          etiquette="Fournisseur"
          obligatoire
          valeur={devis.nomFournisseur}
          onChange={(valeur) => mettreAJourChampTexte("nomFournisseur", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Client"
          valeur={devis.nomClient ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("nomClient", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Numero de devis"
          valeur={devis.numeroDevis ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("numeroDevis", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Date du devis"
          valeur={devis.dateDevis ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("dateDevis", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Validite"
          valeur={devis.validiteDevis ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("validiteDevis", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Devise"
          obligatoire
          valeur={devis.devise}
          onChange={(valeur) => mettreAJourChampTexte("devise", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Montant total HT"
          type="number"
          valeur={devis.montantTotalHT?.toString() ?? ""}
          aide={
            devis.montantTotalHT != null
              ? formatCurrency(devis.montantTotalHT, devis.devise)
              : null
          }
          onChange={(valeur) => mettreAJourChampNombre("montantTotalHT", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Taux TVA (%)"
          type="number"
          valeur={devis.vatRate?.toString() ?? ""}
          onChange={(valeur) => mettreAJourChampNombre("vatRate", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Montant TVA"
          type="number"
          valeur={devis.vatAmount?.toString() ?? ""}
          aide={
            devis.vatAmount != null
              ? formatCurrency(devis.vatAmount, devis.devise)
              : null
          }
          onChange={(valeur) => mettreAJourChampNombre("vatAmount", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexte
          etiquette="Montant total TTC"
          type="number"
          valeur={devis.montantTotalTTC?.toString() ?? ""}
          aide={
            devis.montantTotalTTC != null
              ? formatCurrency(devis.montantTotalTTC, devis.devise)
              : null
          }
          onChange={(valeur) =>
            mettreAJourChampNombre("montantTotalTTC", valeur)
          }
          verrouille={estVerrouille}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">
          Resume
          <textarea
            className="mt-2 min-h-28 w-full rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
            disabled={estVerrouille}
            onChange={(event) =>
              mettreAJourChampTexte("resume", event.target.value)
            }
            value={devis.resume ?? ""}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <ChampTexteLong
          etiquette="Conditions de paiement"
          valeur={devis.paymentTerms ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("paymentTerms", valeur)}
          verrouille={estVerrouille}
        />
        <ChampTexteLong
          etiquette="Contraintes reglementaires"
          valeur={devis.regulatoryNotes ?? ""}
          onChange={(valeur) =>
            mettreAJourChampTexte("regulatoryNotes", valeur)
          }
          verrouille={estVerrouille}
        />
        <ChampTexteLong
          etiquette="Garantie"
          valeur={devis.warranty ?? ""}
          onChange={(valeur) => mettreAJourChampTexte("warranty", valeur)}
          verrouille={estVerrouille}
        />
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
              Lignes du devis
            </p>
            <p className="mt-1 text-sm text-muted">
              Ajustez les descriptions, quantites et montants si l OCR a ete
              approximatif.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={estVerrouille}
            onClick={() =>
              onChange({
                ...devis,
                lignes: [
                  ...devis.lignes,
                  {
                    description: "",
                    quantite: null,
                    prixUnitaire: null,
                    totalLigne: null,
                  },
                ],
              })
            }
            type="button"
          >
            Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[1.25rem] border border-border bg-white">
          <div
            className={`${GRILLE_LIGNES_DEVIS} border-b border-border bg-surface-strong px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted`}
          >
            <span>Description</span>
            <span>Quantite</span>
            <span>Prix unitaire HT</span>
            <span>Total HT</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-border">
            {devis.lignes.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">
                Aucune ligne extraite pour le moment.
              </p>
            ) : (
              devis.lignes.map((ligne, index) => (
                <div
                  key={`${ligne.description}-${index}`}
                  className={`${GRILLE_LIGNES_DEVIS} px-4 py-3`}
                >
                  <input
                    className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                    disabled={estVerrouille}
                    placeholder="Description de la ligne"
                    onChange={(event) =>
                      onChange({
                        ...devis,
                        lignes: mettreAJourLigne(devis.lignes, index, {
                          ...ligne,
                          description: event.target.value,
                        }),
                      })
                    }
                    value={ligne.description}
                  />
                  <input
                    className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                    disabled={estVerrouille}
                    inputMode="decimal"
                    placeholder="0"
                    onChange={(event) =>
                      onChange({
                        ...devis,
                        lignes: mettreAJourLigne(devis.lignes, index, {
                          ...ligne,
                          quantite: convertirVersNombreOptionnel(
                            event.target.value,
                          ),
                        }),
                      })
                    }
                    value={ligne.quantite?.toString() ?? ""}
                  />
                  <input
                    className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                    disabled={estVerrouille}
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(event) =>
                      onChange({
                        ...devis,
                        lignes: mettreAJourLigne(devis.lignes, index, {
                          ...ligne,
                          prixUnitaire: convertirVersNombreOptionnel(
                            event.target.value,
                          ),
                        }),
                      })
                    }
                    value={ligne.prixUnitaire?.toString() ?? ""}
                  />
                  <input
                    className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                    disabled={estVerrouille}
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(event) =>
                      onChange({
                        ...devis,
                        lignes: mettreAJourLigne(devis.lignes, index, {
                          ...ligne,
                          totalLigne: convertirVersNombreOptionnel(
                            event.target.value,
                          ),
                        }),
                      })
                    }
                    value={ligne.totalLigne?.toString() ?? ""}
                  />
                  <div className="flex h-full items-center justify-end">
                    <button
                      className="rounded-full border border-[#d9b7a9] bg-[#fff4ee] px-3 py-2 text-sm font-medium text-[#8f3b19] transition hover:border-[#c97955] hover:bg-[#ffe7db] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={estVerrouille}
                      onClick={() =>
                        onChange({
                          ...devis,
                          lignes: devis.lignes.filter(
                            (_, indexCourant) => indexCourant !== index,
                          ),
                        })
                      }
                      type="button"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type ChampTexteProps = {
  etiquette: string;
  valeur: string;
  aide?: string | null;
  obligatoire?: boolean;
  verrouille?: boolean;
  type?: "number" | "text";
  onChange: (valeur: string) => void;
};

function ChampTexte({
  etiquette,
  valeur,
  aide = null,
  obligatoire = false,
  verrouille = false,
  type = "text",
  onChange,
}: ChampTexteProps) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {etiquette}
      {obligatoire ? " *" : null}
      <input
        className="mt-2 w-full rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        disabled={verrouille}
        inputMode={type === "number" ? "decimal" : undefined}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={valeur}
      />
      {aide ? <span className="mt-2 block text-xs text-muted">{aide}</span> : null}
    </label>
  );
}

type ChampTexteLongProps = {
  etiquette: string;
  valeur: string;
  verrouille?: boolean;
  onChange: (valeur: string) => void;
};

function ChampTexteLong({
  etiquette,
  valeur,
  verrouille = false,
  onChange,
}: ChampTexteLongProps) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {etiquette}
      <textarea
        className="mt-2 min-h-24 w-full rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        disabled={verrouille}
        onChange={(event) => onChange(event.target.value)}
        value={valeur}
      />
    </label>
  );
}
