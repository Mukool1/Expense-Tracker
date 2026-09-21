import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Plus,
  ScanLine,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useForecastStore } from "../store/forecastStore";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "../components/ui";
import CategoryBadge from "../components/CategoryBadge";
import {
  ChartGradient,
  ChartTooltip,
  CHART_COLORS,
} from "../components/charts";
import {
  cx,
  formatDate,
  formatINR,
  formatINRCompact,
  lastNMonthKeys,
  monthKey,
  monthShortLabel,
} from "../lib/format";

const MONTHLY_GRADIENT_ID = "dashboard-spend-trend";
const SPARK_GRADIENT_ID = "dashboard-spark";

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ------------------------------ Stat sparkline ----------------------------- */

function Sparkline({ data, color = "#6366f1", id }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <ChartGradient id={id} color={color} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, spark, children }) {
  const tone = {
    indigo:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    violet:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  }[accent] || "bg-indigo-100 text-indigo-600";
  return (
    <motion.div variants={item} className="h-full">
      <Card className="flex h-full flex-col p-5" hover>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
              {value}
            </p>
            {sub && (
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {sub}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                tone,
              )}
            >
              <Icon size={20} />
            </div>
          )}
        </div>
        {(spark || children) && (
          <div className="mt-3 pt-1">{spark ? spark : children}</div>
        )}
      </Card>
    </motion.div>
  );
}

/* --------------------------------- Dashboard -------------------------------- */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { totalPredicted, forecasts, fetchForecastsForCategories } =
    useForecastStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          fetchTransactions({ limit: 500 }),
          fetchCategories(),
        ]);
        if (cancelled) return;
        const cats = useCategoryStore.getState().categories;
        if (cats.length > 0) {
          await fetchForecastsForCategories(cats.map((c) => c.id));
        }
      } catch {
        if (!cancelled) toast.error("Couldn't load dashboard data.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = useMemo(() => new Date(), []);
  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const todayLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const monthKeys = useMemo(() => lastNMonthKeys(6), []);
  const currentMonthKey = monthKeys[monthKeys.length - 1];
  const prevMonthKey = monthKeys[monthKeys.length - 2];

  const monthlyTotals = useMemo(() => {
    const totals = Object.fromEntries(monthKeys.map((k) => [k, 0]));
    for (const t of transactions) {
      const key = monthKey(t.transaction_date);
      if (key in totals) totals[key] += Number(t.amount) || 0;
    }
    return monthKeys.map((k) => ({
      key: k,
      label: monthShortLabel(k),
      total: totals[k],
    }));
  }, [transactions, monthKeys]);

  const spentThisMonth = monthlyTotals[monthlyTotals.length - 1]?.total ?? 0;
  const spentLastMonth = monthlyTotals[monthlyTotals.length - 2]?.total ?? 0;
  const momDelta =
    spentLastMonth > 0
      ? ((spentThisMonth - spentLastMonth) / spentLastMonth) * 100
      : spentThisMonth > 0
        ? 100
        : 0;

  const momSub =
    spentLastMonth <= 0 && spentThisMonth <= 0 ? (
      "No spend yet"
    ) : (
      <span
        className={cx(
          "inline-flex items-center gap-1 font-semibold",
          momDelta > 0
            ? "text-red-600 dark:text-red-400"
            : momDelta < 0
              ? "text-green-600 dark:text-green-400"
              : "text-slate-500 dark:text-slate-400",
        )}
      >
        {momDelta > 0 ? (
          <TrendingUp size={13} />
        ) : momDelta < 0 ? (
          <TrendingDown size={13} />
        ) : null}
        {momDelta === 0
          ? "Unchanged"
          : `${Math.abs(momDelta).toFixed(0)}% ${momDelta > 0 ? "up" : "down"}`}
        <span className="font-normal text-slate-500 dark:text-slate-400">
          vs {monthShortLabel(prevMonthKey).split(" ")[0]}
        </span>
      </span>
    );

  const recentAnomalies = useMemo(() => {
    const cutoff = daysAgoISO(30);
    return transactions.filter(
      (t) => t.is_anomaly && (t.transaction_date || "") >= cutoff,
    );
  }, [transactions]);

  const anomalyCount90 = useMemo(() => {
    const cutoff = daysAgoISO(90);
    return transactions.filter(
      (t) => t.is_anomaly && (t.transaction_date || "") >= cutoff,
    ).length;
  }, [transactions]);

  const anomalySpend = recentAnomalies.reduce(
    (s, t) => s + (Number(t.amount) || 0),
    0,
  );

  const spendByCategory = useMemo(() => {
    const byCat = {};
    for (const t of transactions) {
      if (monthKey(t.transaction_date) !== currentMonthKey) continue;
      const name = t.category?.name || "Uncategorized";
      byCat[name] = (byCat[name] || 0) + (Number(t.amount) || 0);
    }
    const sorted = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6).reduce((s, c) => s + c.value, 0);
    if (rest > 0) top.push({ name: "Other", value: rest });
    return top;
  }, [transactions, currentMonthKey]);

  const topCategory = spendByCategory[0] || null;

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) =>
          String(b.transaction_date || "").localeCompare(
            String(a.transaction_date || ""),
          ),
        )
        .slice(0, 6),
    [transactions],
  );

  const isInitialLoading = loading && transactions.length === 0;
  const isEmpty = !loading && transactions.length === 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={`${greetingFor(now)}, ${firstName}`}
          subtitle={todayLabel}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => navigate("/transactions/new?mode=scan")}
              >
                <ScanLine size={16} />
                Scan receipt
              </Button>
              <Button onClick={() => navigate("/transactions/new")}>
                <Plus size={16} />
                Add expense
              </Button>
            </>
          }
        />
      </motion.div>

      {isInitialLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
          <Skeleton className="col-span-2 h-72 rounded-2xl lg:col-span-3" />
          <Skeleton className="col-span-2 h-72 rounded-2xl lg:col-span-1" />
          <Skeleton className="col-span-2 h-64 rounded-2xl lg:col-span-4" />
        </div>
      ) : isEmpty ? (
        <motion.div variants={item}>
          <Card>
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Start tracking your spending by adding your first expense — or scan a receipt and let AI do the typing."
              action={
                <Button onClick={() => navigate("/transactions/new")}>
                  <Plus size={16} />
                  Add your first expense
                </Button>
              }
            />
          </Card>
        </motion.div>
      ) : (
        <>
          <AnimatePresence>
            {recentAnomalies.length > 0 && (
              <motion.div
                key="anomaly-banner"
                variants={item}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 p-px"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-[15px] bg-gradient-to-r from-red-600/95 via-red-500/95 to-amber-500/95 px-5 py-4 text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <ShieldAlert size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {recentAnomalies.length} unusual{" "}
                      {recentAnomalies.length === 1
                        ? "transaction"
                        : "transactions"}{" "}
                      flagged
                    </p>
                    <p className="text-sm text-white/85">
                      {formatINR(anomalySpend)} in the last 30 days looks out of
                      the ordinary.
                    </p>
                  </div>
                  <Link
                    to="/transactions"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-white"
                  >
                    Review
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Spent this month"
              value={formatINRCompact(spentThisMonth)}
              sub={momSub}
              icon={Wallet}
              accent="indigo"
              spark={
                <Sparkline
                  id={SPARK_GRADIENT_ID}
                  color="#6366f1"
                  data={monthlyTotals.map((m) => ({
                    label: m.label,
                    value: m.total,
                  }))}
                />
              }
            />
            <StatCard
              label="Predicted next month"
              value={formatINRCompact(totalPredicted)}
              sub={
                forecasts.length > 0 || categories.length > 0 ? (
                  <span>
                    AI forecast across{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {categories.length}
                    </span>{" "}
                    categories
                  </span>
                ) : (
                  "AI forecast"
                )
              }
              icon={Sparkles}
              accent="violet"
            />
            <StatCard
              label="Anomalies flagged"
              value={anomalyCount90}
              sub={
                anomalyCount90 > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <TriangleAlert size={13} />
                    Worth a review
                  </span>
                ) : (
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    All clear
                  </span>
                )
              }
              icon={ShieldAlert}
              accent="red"
            />
            <StatCard
              label="Top category"
              value={
                topCategory ? formatINRCompact(topCategory.value) : "—"
              }
              sub={topCategory ? "Highest spend this month" : "No spend yet"}
              icon={TrendingUp}
              accent="green"
            >
              {topCategory && (
                <CategoryBadge name={topCategory.name} size="sm" />
              )}
            </StatCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <motion.div variants={item} className="lg:col-span-2">
              <Card className="p-5 md:p-6" hover>
                <div className="mb-4">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Spending trend
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last 6 months
                  </p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTotals}
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                      <ChartGradient id={MONTHLY_GRADIENT_ID} color="#6366f1" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tickFormatter={(v) => formatINRCompact(v)}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        width={56}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip formatter={formatINRCompact} />
                        }
                        cursor={{
                          stroke: "#6366f1",
                          strokeDasharray: "4 4",
                          strokeOpacity: 0.5,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Spend"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill={`url(#${MONTHLY_GRADIENT_ID})`}
                        dot={false}
                        activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="flex h-full flex-col p-5 md:p-6" hover>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Spend by category
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {monthShortLabel(currentMonthKey)}
                </p>
                <div className="relative mx-auto h-52 w-full max-w-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendByCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={86}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {spendByCategory.map((entry, i) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip formatter={formatINR} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      {formatINRCompact(spentThisMonth)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      this month
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {spendByCategory.map((entry, i) => (
                    <li
                      key={entry.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {entry.name}
                      </span>
                      <span className="ml-auto font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatINRCompact(entry.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={item} className="mt-4">
            <Card className="p-5 md:p-6" hover>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Recent transactions
                </h2>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  View all
                  <ArrowRight size={15} />
                </Link>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {recent.map((t) => (
                  <li key={t.id}>
                    <Link
                      to="/transactions"
                      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <CategoryBadge
                        name={t.category?.name || "Uncategorized"}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {t.merchant || "Unnamed"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(t.transaction_date)}
                        </p>
                      </div>
                      {t.is_anomaly && (
                        <Badge tone="red" className="shrink-0">
                          Anomaly
                        </Badge>
                      )}
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatINR(t.amount)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
