import { z } from "zod";

export const InvoiceLineSchema = z.object({
  description: z.string().trim().min(1, "La description de ligne est requise."),
  quantity: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
});

export const InvoiceSchema = z.object({
  supplierName: z.string().trim().min(1, "Le fournisseur est requis."),
  invoiceNumber: z.string().trim().nullable().optional(),
  invoiceDate: z.string().trim().nullable().optional(),
  dueDate: z.string().trim().nullable().optional(),
  totalHT: z.number().nullable().optional(),
  totalTTC: z.number().nullable().optional(),
  currency: z.string().trim().min(1).default("EUR"),
  lineItems: z.array(InvoiceLineSchema).default([]),
  summary: z.string().trim().nullable().optional(),
});

export const ExtractInvoiceRequestSchema = z.object({
  ocrText: z.string().trim().min(1, "Le texte OCR est requis."),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;
export type InvoiceData = z.infer<typeof InvoiceSchema>;
export type ExtractInvoiceRequest = z.infer<typeof ExtractInvoiceRequestSchema>;
