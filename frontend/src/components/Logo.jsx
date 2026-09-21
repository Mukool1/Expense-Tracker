import { Sparkles } from "lucide-react";

const SIZES = {
  sm: { box: "h-7 w-7 rounded-lg", icon: 15, text: "text-base", gap: "gap-2" },
  md: { box: "h-9 w-9 rounded-xl", icon: 20, text: "text-xl", gap: "gap-2.5" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: 26, text: "text-2xl", gap: "gap-3" },
};

export default function Logo({ size = "md" }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <span
        className={`flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/30 ${s.box}`}
      >
        <Sparkles size={s.icon} strokeWidth={2.25} />
      </span>
      <span
        className={`font-display font-bold tracking-tight text-slate-900 dark:text-white ${s.text}`}
      >
        Expense<span className="text-gradient">AI</span>
      </span>
    </span>
  );
}
