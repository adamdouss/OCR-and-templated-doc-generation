// Thin HTTP wrapper around the OCR service. Validation and Mistral calls live
// in src/lib/ocr.ts so this route stays easy to reason about.
import { NextResponse } from "next/server";

import { OcrError, extractTextFromPdf } from "@/lib/ocr";

// request.formData() returns a generic entry, so we narrow it structurally
// instead of relying on brittle runtime classes across environments.
function estUnFichierTeleverse(valeur: FormDataEntryValue | null): valeur is File {
  if (!valeur || typeof valeur === "string") {
    return false;
  }

  return (
    typeof valeur.arrayBuffer === "function" &&
    typeof valeur.name === "string" &&
    typeof valeur.type === "string"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file = estUnFichierTeleverse(fileEntry) ? fileEntry : null;

    const text = await extractTextFromPdf(file);

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof OcrError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status },
      );
    }

    console.error("OCR route unexpected error", error);

    return NextResponse.json(
      {
        error: "Une erreur inattendue est survenue pendant l'OCR.",
      },
      { status: 500 },
    );
  }
}
