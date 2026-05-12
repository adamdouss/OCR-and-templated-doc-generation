import "server-only";

import type { OCRResponse } from "@mistralai/mistralai/models/components";

import { getMistralClient } from "@/lib/mistral";

const OCR_MODEL = "mistral-ocr-latest";
const PDF_MIME_TYPE = "application/pdf";

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
      file: File;
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

export function isPdfFile(file: File): boolean {
  if (file.type === PDF_MIME_TYPE) {
    return true;
  }

  return file.name.toLowerCase().endsWith(".pdf");
}

export function normalizeOcrResponse(response: OCRResponse): string {
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

export async function extractTextFromPdf(
  file: File | null,
  client?: OcrClient,
): Promise<string> {
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
    const uploadedFile = await activeClient.files.upload({
      file,
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
