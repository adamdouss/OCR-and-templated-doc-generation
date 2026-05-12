import { NextResponse } from "next/server";

import { OcrError, extractTextFromPdf } from "@/lib/ocr";

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
