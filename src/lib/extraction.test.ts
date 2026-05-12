import { describe, expect, it, vi } from "vitest";

import {
  ExtractionError,
  extractInvoiceData,
  parseInvoiceFromChatMessage,
} from "@/lib/extraction";

describe("parseInvoiceFromChatMessage", () => {
  it("parses valid JSON into invoice data", () => {
    const invoice = parseInvoiceFromChatMessage(`
      {
        "supplierName": "ACME Fournitures",
        "invoiceNumber": "FAC-2026-001",
        "invoiceDate": "2026-05-10",
        "dueDate": "2026-06-10",
        "totalHT": 100,
        "totalTTC": 120,
        "currency": "EUR",
        "lineItems": [],
        "summary": "Facture de test"
      }
    `);

    expect(invoice.supplierName).toBe("ACME Fournitures");
    expect(invoice.totalTTC).toBe(120);
  });

  it("throws a clean error for invalid JSON", () => {
    expect(() => parseInvoiceFromChatMessage("{invalid-json")).toThrowError(
      ExtractionError,
    );

    try {
      parseInvoiceFromChatMessage("{invalid-json");
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError);
      expect((error as ExtractionError).code).toBe("INVALID_JSON");
    }
  });

  it("throws a clean error for schema validation failures", () => {
    expect(() =>
      parseInvoiceFromChatMessage(`
        {
          "supplierName": "",
          "invoiceNumber": null,
          "invoiceDate": null,
          "dueDate": null,
          "totalHT": null,
          "totalTTC": null,
          "currency": "EUR",
          "lineItems": [],
          "summary": null
        }
      `),
    ).toThrowError(ExtractionError);

    try {
      parseInvoiceFromChatMessage(`
        {
          "supplierName": "",
          "invoiceNumber": null,
          "invoiceDate": null,
          "dueDate": null,
          "totalHT": null,
          "totalTTC": null,
          "currency": "EUR",
          "lineItems": [],
          "summary": null
        }
      `);
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError);
      expect((error as ExtractionError).code).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });
});

describe("extractInvoiceData", () => {
  it("uses the chat parser and returns validated data", async () => {
    const parse = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              supplierName: "ACME Fournitures",
              invoiceNumber: "FAC-2026-001",
              invoiceDate: "2026-05-10",
              dueDate: "2026-06-10",
              totalHT: 100,
              totalTTC: 120,
              currency: "EUR",
              lineItems: [],
              summary: "Facture de test",
            }),
          },
        },
      ],
    });

    const invoice = await extractInvoiceData("OCR text", { parse });

    expect(parse).toHaveBeenCalledOnce();
    expect(invoice.supplierName).toBe("ACME Fournitures");
  });

  it("rejects missing OCR text before calling Mistral", async () => {
    const parse = vi.fn();

    await expect(extractInvoiceData("   ", { parse })).rejects.toMatchObject({
      code: "MISSING_OCR_TEXT",
    });

    expect(parse).not.toHaveBeenCalled();
  });
});
