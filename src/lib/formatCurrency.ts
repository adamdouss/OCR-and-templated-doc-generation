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
