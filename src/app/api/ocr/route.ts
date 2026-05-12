import { NextResponse } from "next/server";

import { OcrError, extractTextFromPdf } from "@/lib/ocr";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;

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

    return NextResponse.json(
      {
        error: "Une erreur inattendue est survenue pendant l'OCR.",
      },
      { status: 500 },
    );
  }
}
