export function formatMoney(
  value: unknown,
  options?: { currency?: string; digits?: number },
) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "—");
  const digits = options?.digits ?? 2;
  const formatted = new Intl.NumberFormat("en-LY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return options?.currency ? `${formatted} ${options.currency}` : formatted;
}

export function moneyClassName() {
  return "font-mono tabular-nums";
}
