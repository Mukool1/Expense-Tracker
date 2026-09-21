/** Join truthy class-name parts with a space. */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Indian currency, e.g. formatINR(12500) -> "₹12,500". */
export function formatINR(n, opts) {
  const decimals = opts?.decimals ?? 0;
  const value = Number(n);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Compact Indian currency: "₹1.2L" for >= 1,00,000, "₹45K" for >= 1,000 (trailing .0 trimmed). */
export function formatINRCompact(n) {
  const value = Number(n);
  const v = Number.isFinite(value) ? value : 0;
  const trim = (x) => x.replace(/\.0$/, "");
  if (v >= 100000) return `₹${trim((v / 100000).toFixed(1))}L`;
  if (v >= 1000) return `₹${trim((v / 1000).toFixed(1))}K`;
  return formatINR(v);
}

/** "2026-09-21" -> "21 Sep 2026". Invalid input -> "—". */
export function formatDate(iso) {
  if (!iso) return "—";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const idx = Number(m[2]) - 1;
    if (idx < 0 || idx > 11) return "—";
    return `${Number(m[3])} ${MONTHS_SHORT[idx]} ${m[1]}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-09-21" (or a Date) -> "2026-09". Invalid input -> "". */
export function monthKey(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (!isoOrDate || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-09" -> "Sep ’26". Invalid input -> "—". */
export function monthShortLabel(key) {
  if (!key || !/^\d{4}-\d{2}$/.test(key)) return "—";
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return "—";
  return `${MONTHS_SHORT[idx]} ’${y.slice(2)}`;
}

/** Array of "YYYY-MM" keys, oldest -> newest, ending with the current month. */
export function lastNMonthKeys(n) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

/** Today's date as "YYYY-MM-DD" in local time. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
