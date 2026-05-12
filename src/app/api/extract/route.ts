import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  ExtractionError,
  extraireDonneesDevisFournisseur,
} from "@/lib/extraction";
import { RequeteExtractionDevisSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const corps = await request.json();
    const { texteOcr } = RequeteExtractionDevisSchema.parse(corps);
    const devis = await extraireDonneesDevisFournisseur(texteOcr);

    return NextResponse.json({ devis });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "La requete d'extraction est invalide.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof ExtractionError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "Une erreur inattendue est survenue pendant l'extraction.",
      },
      { status: 500 },
    );
  }
}
