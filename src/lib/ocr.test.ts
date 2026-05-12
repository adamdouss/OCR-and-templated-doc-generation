import { describe, expect, it, vi } from "vitest";

import {
  extractTextFromPdf,
  isPdfFile,
  normalizeOcrResponse,
  OcrError,
} from "@/lib/ocr";

describe("isPdfFile", () => {
  it("accepts the PDF mime type", () => {
    const file = new File(["hello"], "quote.bin", {
      type: "application/pdf",
    });

    expect(isPdfFile(file)).toBe(true);
  });

  it("accepts a .pdf extension when mime type is empty", () => {
    const file = new File(["hello"], "quote.pdf", { type: "" });

    expect(isPdfFile(file)).toBe(true);
  });

  it("rejects non-pdf files", () => {
    const file = new File(["hello"], "quote.txt", { type: "text/plain" });

    expect(isPdfFile(file)).toBe(false);
  });
});

describe("normalizeOcrResponse", () => {
  it("joins page markdown in page order", () => {
    const text = normalizeOcrResponse({
      model: "mistral-ocr-latest",
      pages: [
        {
          index: 1,
          markdown: "Page 2",
          images: [],
          dimensions: null,
        },
        {
          index: 0,
          markdown: "Page 1",
          images: [],
          dimensions: null,
        },
      ],
      usageInfo: {
        pagesProcessed: 2,
        docSizeBytes: 12,
      },
    });

    expect(text).toBe("Page 1\n\nPage 2");
  });

  it("throws when OCR content is empty", () => {
    expect(() =>
      normalizeOcrResponse({
        model: "mistral-ocr-latest",
        pages: [
          {
            index: 0,
            markdown: "   ",
            images: [],
            dimensions: null,
          },
        ],
        usageInfo: {
          pagesProcessed: 1,
          docSizeBytes: 0,
        },
      }),
    ).toThrowError(OcrError);
  });
});

describe("extractTextFromPdf", () => {
  it("rejects missing files", async () => {
    await expect(extractTextFromPdf(null)).rejects.toMatchObject({
      code: "MISSING_FILE",
    });
  });

  it("rejects non-pdf files", async () => {
    const file = new File(["hello"], "quote.txt", { type: "text/plain" });

    await expect(extractTextFromPdf(file)).rejects.toMatchObject({
      code: "INVALID_FILE_TYPE",
    });
  });

  it("uploads, OCRs, and deletes the temporary file", async () => {
    const upload = vi.fn().mockResolvedValue({ id: "file_123" });
    const remove = vi.fn().mockResolvedValue({});
    const process = vi.fn().mockResolvedValue({
      model: "mistral-ocr-latest",
      pages: [
        {
          index: 0,
          markdown: "Devis fournisseur",
          images: [],
          dimensions: null,
        },
      ],
      usageInfo: {
        pagesProcessed: 1,
        docSizeBytes: 42,
      },
    });

    const file = new File(["pdf"], "quote.pdf", { type: "application/pdf" });

    const text = await extractTextFromPdf(file, {
      files: {
        upload,
        delete: remove,
      },
      ocr: {
        process,
      },
    });

    expect(text).toBe("Devis fournisseur");
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith({
      file: {
        fileName: "quote.pdf",
        content: expect.any(Uint8Array),
      },
      purpose: "ocr",
    });
    expect(process).toHaveBeenCalledWith({
      model: "mistral-ocr-latest",
      document: {
        type: "file",
        fileId: "file_123",
      },
      includeImageBase64: false,
    });
    expect(remove).toHaveBeenCalledWith({ fileId: "file_123" });
  });
});
