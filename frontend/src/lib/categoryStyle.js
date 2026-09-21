import {
  UtensilsCrossed,
  ShoppingCart,
  CarFront,
  ShoppingBag,
  Clapperboard,
  Zap,
  HeartPulse,
  Plane,
  PiggyBank,
  Coffee,
} from "lucide-react";

/**
 * Visual identity per category: icon + tailwind classes + raw hex (for charts).
 * `soft`  -> chip/badge classes (icon in a tinted square)
 * `dot`   -> small status-dot class
 * `gradient` -> tailwind gradient stops, e.g. `bg-gradient-to-br ${gradient}`
 */
export const PALETTE = [
  {
    Icon: UtensilsCrossed,
    soft: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    gradient: "from-orange-500 to-amber-500",
    hex: "#f97316",
  },
  {
    Icon: ShoppingCart,
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    hex: "#10b981",
  },
  {
    Icon: CarFront,
    soft: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    gradient: "from-sky-500 to-blue-500",
    hex: "#0ea5e9",
  },
  {
    Icon: ShoppingBag,
    soft: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-purple-500",
    hex: "#8b5cf6",
  },
  {
    Icon: Clapperboard,
    soft: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    gradient: "from-rose-500 to-pink-500",
    hex: "#f43f5e",
  },
  {
    Icon: Zap,
    soft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    hex: "#f59e0b",
  },
  {
    Icon: HeartPulse,
    soft: "bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    gradient: "from-red-500 to-rose-500",
    hex: "#ef4444",
  },
  {
    Icon: Plane,
    soft: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    gradient: "from-indigo-500 to-blue-500",
    hex: "#6366f1",
  },
  {
    Icon: PiggyBank,
    soft: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    gradient: "from-teal-500 to-emerald-500",
    hex: "#14b8a6",
  },
  {
    Icon: Coffee,
    soft: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
    gradient: "from-cyan-500 to-sky-500",
    hex: "#06b6d4",
  },
];

/** Hex colors in palette order — feed straight into recharts. */
export const CHART_HEX = PALETTE.map((p) => p.hex);

// Keyword overrides: [keywords..., palette index]
const KEYWORD_OVERRIDES = [
  [["food", "dining", "restaurant", "swiggy", "zomato", "domino"], 0],
  [["grocer", "bigbasket", "dmart", "blinkit", "supermarket"], 1],
  [["transport", "uber", "ola", "cab", "taxi", "fuel", "metro", "petrol"], 2],
  [["shopping", "amazon", "myntra", "croma", "flipkart"], 3],
  [["entertain", "movie", "bookmyshow", "netflix", "spotify", "cinema"], 4],
  [["utilit", "electricity", "jio", "bill", "bescom", "power", "water", "gas"], 5],
  [["health", "pharmacy", "apollo", "practo", "hospital", "medical"], 6],
  [["travel", "irctc", "flight", "hotel", "indigo", "makemytrip", "trip"], 7],
];

/**
 * Return the palette entry for a category name.
 * Keyword match first, otherwise a deterministic hash of the name.
 * Never throws — empty/undefined names hash to a stable entry.
 */
export function categoryStyle(name) {
  const label = (name ?? "").toString().toLowerCase();
  for (const [keywords, index] of KEYWORD_OVERRIDES) {
    if (keywords.some((k) => label.includes(k))) return PALETTE[index];
  }
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
