import { CHART_HEX } from "../lib/categoryStyle";
import { formatINR } from "../lib/format";

export const CHART_COLORS = CHART_HEX;

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => formatINR(v),
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl dark:border-white/10 dark:bg-[#151522]/95">
      {label != null && label !== "" && (
        <p className="mb-1.5 text-xs font-bold text-slate-900 dark:text-white">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const color =
            entry.color || entry.payload?.fill || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-500 dark:text-slate-400">
                {entry.name}
              </span>
              <span className="ml-auto pl-3 font-semibold text-slate-900 tabular-nums dark:text-white">
                {formatter(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartGradient({ id, color }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}
