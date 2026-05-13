import "server-only";

// OCR service: validates the uploaded file, sends it to Mistral OCR, and
// normalizes the response into a single plain-text block for extraction.
import { Buffer } from "node:buffer";

import type { OCRResponse } from "@mistralai/mistralai/models/components";

import { getMistralClient } from "@/lib/mistral";

const OCR_MODEL = "mistral-ocr-latest";
const PDF_MIME_TYPE = "application/pdf";

export type FichierPdfTeleverse = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  type: string;
};

// OCR errors are explicit because the UI and the API route need to distinguish
// between user mistakes (missing PDF) and service failures (Mistral error).
type OcrFailureCode =
  | "MISSING_FILE"
  | "INVALID_FILE_TYPE"
  | "EMPTY_OCR_RESPONSE"
  | "MISTRAL_API_ERROR";

export class OcrError extends Error {
  readonly code: OcrFailureCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: OcrFailureCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: unknown;
      status?: number;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "OcrError";
    this.code = code;
    this.status = options?.status ?? 500;
    this.details = options?.details;
  }
}

type OcrClient = {
  files: {
    upload: (request: {
      file: {
        fileName: string;
    content: Uint8Array;
      };
    purpose: "ocr";
  }) => Promise<{ id: string }>;
    delete: (request: { fileId: string }) => Promise<unknown>;
  };
  ocr: {
    process: (request: {
      model: string;
      document: { type: "file"; fileId: string };
      includeImageBase64: boolean;
    }) => Promise<OCRResponse>;
  };
};

export function isPdfFile(file: FichierPdfTeleverse): boolean {
  // MIME type is preferred, but we also keep the extension fallback because
  // some browsers or test clients do not populate file.type reliably.
  if (file.type === PDF_MIME_TYPE) {
    return true;
  }

  return file.name.toLowerCase().endsWith(".pdf");
}

export function normalizeOcrResponse(response: OCRResponse): string {
  // Pages are sorted defensively so downstream extraction always receives
  // deterministic text, even if the SDK response order changes.
  const text = response.pages
    .slice()
    .sort((left, right) => left.index - right.index)
    .map((page) => page.markdown.trim())
    .filter((page) => page.length > 0)
    .join("\n\n");

  if (!text.trim()) {
    throw new OcrError("EMPTY_OCR_RESPONSE", "La reponse OCR est vide.", {
      status: 502,
    });
  }

  return text;
}

async function convertFileForMistral(file: FichierPdfTeleverse): Promise<{
  fileName: string;
  content: Uint8Array;
}> {
  // Mistral expects binary content, not a browser File object directly.
  const arrayBuffer = await file.arrayBuffer();

  return {
    fileName: file.name,
    content: Buffer.from(arrayBuffer),
  };
}

export async function extractTextFromPdf(
  file: FichierPdfTeleverse | null,
  client?: OcrClient,
): Promise<string> {
  // Early validation keeps the API route very small and makes the failure mode
  // obvious before any network call happens.
  if (!file) {
    throw new OcrError("MISSING_FILE", "Aucun fichier PDF n'a ete fourni.", {
      status: 400,
    });
  }

  if (!isPdfFile(file)) {
    throw new OcrError(
      "INVALID_FILE_TYPE",
      "Le fichier doit etre un PDF valide.",
      {
        details: { fileName: file.name, mimeType: file.type || null },
        status: 400,
      },
    );
  }

  const activeClient = client ?? getMistralClient();
  let uploadedFileId: string | undefined;

  try {
    // The file is uploaded first, then passed by id to the OCR endpoint.
    // This mirrors the Mistral SDK flow and keeps the route logic simple.
    const uploadedPayload = await convertFileForMistral(file);
    const uploadedFile = await activeClient.files.upload({
      file: uploadedPayload,
      purpose: "ocr",
    });
    uploadedFileId = uploadedFile.id;

    const response = await activeClient.ocr.process({
      model: OCR_MODEL,
      document: {
        type: "file",
        fileId: uploadedFileId,
      },
      includeImageBase64: false,
    });

    return normalizeOcrResponse(response);
  } catch (error) {
    if (error instanceof OcrError) {
      throw error;
    }

    throw new OcrError("MISTRAL_API_ERROR", "L'appel OCR a Mistral a echoue.", {
      cause: error,
      status: 502,
    });
  } finally {
    if (uploadedFileId) {
      try {
        await activeClient.files.delete({ fileId: uploadedFileId });
      } catch {
        // Best-effort cleanup only. OCR result has already been computed.
      }
    }
  }
}
