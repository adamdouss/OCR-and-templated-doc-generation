// Shared formatting helper so the UI and the generated DOCX present monetary
// values the same way for French users.
export function formatCurrency(
  value: number | null | undefined,
  currency = "EUR",
): string {
  if (value == null) {
    return "";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency,
    style: "currency",
  }).format(value);
}
