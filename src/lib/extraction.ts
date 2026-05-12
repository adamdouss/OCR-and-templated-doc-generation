import "server-only";

import { ZodError } from "zod";

import { getMistralClient } from "@/lib/mistral";
import { InvoiceSchema, type InvoiceData } from "@/lib/schemas";

const EXTRACTION_MODEL = "mistral-small-latest";

const EXTRACTION_SYSTEM_PROMPT = `
You are an information extraction assistant specialized in supplier invoices.

Extract structured invoice data from the OCR text provided by the user.

Return only valid JSON.
Do not include explanations.
Do not include Markdown.
If a field is missing, return null.
For numeric amounts, return numbers only, without currency symbols.
`.trim();

type ExtractionFailureCode =
  | "MISSING_OCR_TEXT"
  | "EMPTY_LLM_RESPONSE"
  | "INVALID_JSON"
  | "SCHEMA_VALIDATION_FAILED"
  | "MISTRAL_API_ERROR";

export class ExtractionError extends Error {
  readonly code: ExtractionFailureCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ExtractionFailureCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: unknown;
      status?: number;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ExtractionError";
    this.code = code;
    this.details = options?.details;
    this.status = options?.status ?? 500;
  }
}

type ChatParser = {
  parse: (request: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    responseFormat: typeof InvoiceSchema;
  }) => Promise<{
    choices?: Array<{
      message?: {
        content?: string | null | Array<unknown>;
      } | null;
    }>;
  }>;
};

function getAssistantContent(
  response: Awaited<ReturnType<ChatParser["parse"]>>,
): string {
  const content = response.choices?.[0]?.message?.content;

  if (!content || Array.isArray(content)) {
    throw new ExtractionError(
      "EMPTY_LLM_RESPONSE",
      "La reponse du modele d'extraction est vide.",
      { status: 502 },
    );
  }

  return content;
}

export function parseInvoiceFromChatMessage(content: string): InvoiceData {
  let payload: unknown;

  try {
    payload = JSON.parse(content);
  } catch (error) {
    throw new ExtractionError(
      "INVALID_JSON",
      "Le modele a renvoye un JSON invalide.",
      { cause: error, status: 502 },
    );
  }

  try {
    return InvoiceSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ExtractionError(
        "SCHEMA_VALIDATION_FAILED",
        "Les donnees extraites ne respectent pas le schema facture.",
        { cause: error, details: error.flatten(), status: 422 },
      );
    }

    throw error;
  }
}

export async function extractInvoiceData(
  ocrText: string,
  parser: ChatParser = getMistralClient().chat,
): Promise<InvoiceData> {
  const trimmedText = ocrText.trim();

  if (!trimmedText) {
    throw new ExtractionError("MISSING_OCR_TEXT", "Le texte OCR est absent.", {
      status: 400,
    });
  }

  let response: Awaited<ReturnType<ChatParser["parse"]>>;

  try {
    response = await parser.parse({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: trimmedText },
      ],
      responseFormat: InvoiceSchema,
    });
  } catch (error) {
    throw new ExtractionError(
      "MISTRAL_API_ERROR",
      "L'appel a Mistral pour l'extraction a echoue.",
      { cause: error, status: 502 },
    );
  }

  return parseInvoiceFromChatMessage(getAssistantContent(response));
}
