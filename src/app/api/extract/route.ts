import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ExtractionError, extractInvoiceData } from "@/lib/extraction";
import { ExtractInvoiceRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ocrText } = ExtractInvoiceRequestSchema.parse(body);
    const invoice = await extractInvoiceData(ocrText);

    return NextResponse.json({ invoice });
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
