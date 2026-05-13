// HTTP endpoint for DOCX export. The route only validates input and streams
// the generated file back; template mapping stays in src/lib/docx.ts.
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DocxError, genererBonCommandeDocx } from "@/lib/docx";
import { DevisFournisseurSchema } from "@/lib/schemas";

const MIME_TYPE_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: Request) {
  try {
    const corps = await request.json();
    const devis = DevisFournisseurSchema.parse(corps?.devis);
    const { buffer, nomFichier } = await genererBonCommandeDocx(devis);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Disposition": `attachment; filename="${nomFichier}"`,
        "Content-Type": MIME_TYPE_DOCX,
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "La requete de generation DOCX est invalide.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof DocxError) {
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
        error: "Une erreur inattendue est survenue pendant la generation du DOCX.",
      },
      { status: 500 },
    );
  }
}
