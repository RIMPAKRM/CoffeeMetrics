const intFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatInt(v: number): string {
  return intFmt.format(Math.round(v));
}

/** 1 700 ₸ */
export function formatTenge(v: number): string {
  return `${intFmt.format(Math.round(v))} ₸`;
}

/** 52,6 млн ₸ / 197,5 тыс ₸ / 800 ₸ */
export function formatTengeCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return `${oneDecimal.format(v / 1_000_000)} млн ₸`;
  if (Math.abs(v) >= 10_000) return `${oneDecimal.format(v / 1_000)} тыс ₸`;
  return formatTenge(v);
}

/** Axis labels without the currency sign: 250 тыс / 1 млн */
export function formatShort(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return `${oneDecimal.format(v / 1_000_000)} млн`;
  if (Math.abs(v) >= 1_000) return `${intFmt.format(v / 1_000)} тыс`;
  return intFmt.format(v);
}

/** +9,4% */
export function formatDelta(pct: number): string {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${oneDecimal.format(Math.abs(pct)).replace(/,?0$/, "")}%`;
}

export function formatPct(pct: number): string {
  return `${intFmt.format(Math.round(pct))}%`;
}

const dayFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

/** "16 июл — 13 окт 2026" */
export function formatRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T00:00:00`);
  const e = new Date(`${endIso}T00:00:00`);
  return `${dayFmt.format(s)} — ${dayFmt.format(e)} ${e.getFullYear()}`;
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${dayFmt.format(d)}, ${timeFmt.format(d)}`;
}
