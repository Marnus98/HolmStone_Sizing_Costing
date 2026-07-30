/** South African Rand / number formatting helpers, used consistently across the app. */

export function formatZAR(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function formatPct(fraction: number, decimals = 1): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction || 0);
}

export function formatDateSA(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", { year: "numeric", month: "short" }).format(new Date(iso + "T00:00:00Z"));
}
