import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  Info,
  Plus,
  Wallet,
} from "lucide-react";
import { useCategoryStore } from "../store/categoryStore";
import { useForecastStore } from "../store/forecastStore";
import {
  Button,
  Card,
  Badge,
  Skeleton,
  EmptyState,
  PageHeader,
} from "../components/ui";
import CategoryBadge from "../components/CategoryBadge";
import { ChartTooltip } from "../components/charts";
import { formatINR, formatINRCompact, cx } from "../lib/format";
import { toast } from "../store/toastStore";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function shortName(name) {
  const n = String(name ?? "");
  return n.length > 10 ? `${n.slice(0, 9)}…` : n;
}

function Forecasts() {
  const { categories, fetchCategories } = useCategoryStore();
  const { forecasts, totalPredicted, loading, fetchForecastsForCategories } =
    useForecastStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchCategories();
      } catch {
        if (!cancelled) toast.error("Couldn't load forecasts.");
        return;
      }
      try {
        const ids = useCategoryStore.getState().categories.map((c) => c.id);
        if (ids.length > 0) await fetchForecastsForCategories(ids);
      } catch {
        if (!cancelled) toast.error("Couldn't load forecasts.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const forecastById = useMemo(() => {
    const map = new Map();
    for (const f of forecasts) map.set(f.category_id, f);
    return map;
  }, [forecasts]);

  const cards = useMemo(
    () =>
      categories.map((c) => ({
        category: c,
        forecast: forecastById.get(c.id) ?? null,
      })),
    [categories, forecastById],
  );

  const chartData = useMemo(
    () =>
      cards
        .filter(({ forecast }) => forecast && forecast.predicted_amount != null)
        .map(({ category, forecast }) => ({
          name: shortName(category.name),
          lastMonth: Number(forecast.based_on?.spend_last_month) || 0,
          predicted: Number(forecast.predicted_amount) || 0,
        })),
    [cards],
  );

  const lastMonthTotal = useMemo(
    () =>
      forecasts.reduce(
        (sum, f) => sum + (Number(f.based_on?.spend_last_month) || 0),
        0,
      ),
    [forecasts],
  );

  const delta = totalPredicted - lastMonthTotal;
  const saving = delta < 0;
  const hasAnyForecast = chartData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-12 pt-24 transition-colors duration-300 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Forecasts"
          subtitle="What next month looks like, before it happens."
          actions={
            <Link to="/transactions/new">
              <Button variant="outline" size="sm">
                <Plus size={15} />
                Add expense
              </Button>
            </Link>
          }
        />

        {loading ? (
          <LoadingState />
        ) : categories.length === 0 || !hasAnyForecast ? (
          <EmptyState
            icon={TrendingUp}
            title="No forecasts yet"
            description="Add a few weeks of spending and we'll start predicting."
            action={
              <Link to="/transactions/new">
                <Button>
                  <Plus size={16} />
                  Add expense
                </Button>
              </Link>
            }
          />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Hero summary */}
            <motion.div variants={item}>
              <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg shadow-indigo-600/25 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <Wallet size={15} />
                      Predicted spend · next month
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                      {formatINRCompact(totalPredicted)}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-medium text-white/80">
                      Last month
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white/95">
                      {formatINRCompact(lastMonthTotal)}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      {saving ? (
                        <TrendingDown size={14} />
                      ) : (
                        <TrendingUp size={14} />
                      )}
                      {saving
                        ? `On track to save ${formatINRCompact(Math.abs(delta))}`
                        : `${formatINRCompact(Math.abs(delta))} more than last month`}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bar chart */}
            <motion.div variants={item}>
              <Card className="p-5 sm:p-6">
                <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
                  Last month vs predicted
                </h2>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  How next month is expected to compare, per category.
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      barGap={4}
                    >
                      <defs>
                        <linearGradient
                          id="forecast-predicted"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#e879f9" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#94a3b8"
                        strokeOpacity={0.25}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={chartData.length > 6 ? -25 : 0}
                        height={chartData.length > 6 ? 48 : 28}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatINRCompact(v)}
                        width={64}
                      />
                      <Tooltip
                        content={<ChartTooltip formatter={(v) => formatINR(v)} />}
                        cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value) =>
                          value === "predicted" ? "Predicted" : "Last month"
                        }
                      />
                      <Bar
                        dataKey="lastMonth"
                        name="lastMonth"
                        fill="#94a3b8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="predicted"
                        name="predicted"
                        fill="url(#forecast-predicted)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Per-category cards */}
            <motion.div
              variants={container}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {cards.map(({ category, forecast }) => (
                <motion.div key={category.id} variants={item}>
                  <ForecastCard category={category} forecast={forecast} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ForecastCard({ category, forecast }) {
  const predicted =
    forecast && forecast.predicted_amount != null
      ? Number(forecast.predicted_amount)
      : null;
  const avg3 = Number(forecast?.based_on?.spend_avg_3mo) || 0;
  const avg6 = Number(forecast?.based_on?.spend_avg_6mo) || 0;
  const last = Number(forecast?.based_on?.spend_last_month) || 0;

  const ratio = avg3 > 0 && predicted != null ? predicted / avg3 : null;
  const barWidth = ratio == null ? 0 : Math.min(100, Math.round(ratio * 100));
  const barTone =
    ratio == null
      ? "bg-slate-300 dark:bg-white/20"
      : ratio <= 0.9
        ? "bg-emerald-500"
        : ratio <= 1.1
          ? "bg-amber-500"
          : "bg-rose-500";

  return (
    <Card hover className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge name={category.name} />
        {forecast?.personalized ? (
          <Badge tone="indigo">
            <Sparkles size={12} />
            Personalized
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <Users size={12} />
            Estimated from similar users
          </span>
        )}
      </div>

      {predicted == null ? (
        <div className="mt-4 flex flex-1 items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>
            {forecast?.message ??
              "Not enough data yet — keep logging spending and we'll start predicting."}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
            {formatINRCompact(predicted)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Predicted for next month
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>vs 3-mo average</span>
              <span className="tabular-nums">
                {ratio == null ? "—" : `${Math.round(ratio * 100)}%`}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className={cx("h-full rounded-full transition-all", barTone)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-white/10">
            <MiniStat label="Last mo" value={formatINRCompact(last)} />
            <MiniStat label="3-mo avg" value={formatINRCompact(avg3)} />
            <MiniStat label="6-mo avg" value={formatINRCompact(avg6)} />
          </div>
        </>
      )}
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 sm:p-8">
        <Skeleton className="h-4 w-48 bg-white/20" />
        <Skeleton className="mt-4 h-12 w-56 bg-white/20" />
        <div className="mt-6 flex gap-6">
          <Skeleton className="h-8 w-32 bg-white/20" />
          <Skeleton className="h-6 w-40 bg-white/20" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="mt-4 h-9 w-32" />
            <Skeleton className="mt-4 h-2 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Forecasts;
