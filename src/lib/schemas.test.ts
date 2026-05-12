import { describe, expect, it } from "vitest";

import { InvoiceSchema } from "@/lib/schemas";

describe("InvoiceSchema", () => {
  it("accepts valid invoice data", () => {
    const result = InvoiceSchema.safeParse({
      supplierName: "ACME Fournitures",
      invoiceNumber: "FAC-2026-001",
      invoiceDate: "2026-05-10",
      dueDate: "2026-06-10",
      totalHT: 100,
      totalTTC: 120,
      currency: "EUR",
      lineItems: [
        {
          description: "Papier A4",
          quantity: 10,
          unitPrice: 10,
          total: 100,
        },
      ],
      summary: "Fournitures de bureau.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid invoice data", () => {
    const result = InvoiceSchema.safeParse({
      supplierName: "",
      totalHT: "100",
      lineItems: [{ description: "" }],
    });

    expect(result.success).toBe(false);
  });
});
