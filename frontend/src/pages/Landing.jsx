import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ScanLine,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Wallet,
  BellRing,
  ArrowRight,
  Play,
  Check,
  Camera,
  AlertTriangle,
  ChevronDown,
  Zap,
  PieChart,
  BrainCircuit,
} from "lucide-react";
import Logo from "../components/Logo";
import { Button, Card } from "../components/ui";
import { formatINR } from "../lib/format";

/* ------------------------------ static demo data ------------------------------ */

const DASHBOARD_SERIES = [
  { day: "1", spend: 820 },
  { day: "2", spend: 1150 },
  { day: "3", spend: 640 },
  { day: "4", spend: 1490 },
  { day: "5", spend: 980 },
  { day: "6", spend: 1720 },
  { day: "7", spend: 1240 },
  { day: "8", spend: 890 },
  { day: "9", spend: 1560 },
  { day: "10", spend: 1340 },
  { day: "11", spend: 1980 },
  { day: "12", spend: 1410 },
];

const DASHBOARD_CATEGORIES = [
  { name: "Food & Dining", amount: 12480, color: "#8b5cf6" },
  { name: "Shopping", amount: 8920, color: "#ec4899" },
  { name: "Transport", amount: 6340, color: "#6366f1" },
];

const FORECAST_DATA = [
  { cat: "Food", actual: 12480, predicted: 13900 },
  { cat: "Shopping", actual: 8920, predicted: 7400 },
  { cat: "Transport", actual: 6340, predicted: 6800 },
  { cat: "Utilities", actual: 5210, predicted: 5300 },
  { cat: "Health", actual: 3850, predicted: 4100 },
];

const MERCHANTS = [
  "Swiggy",
  "Zomato",
  "BigBasket",
  "DMart",
  "Amazon.in",
  "Uber",
  "IRCTC",
  "Jio",
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "Snap a receipt",
    copy: "Point, shoot, done. OCR auto-fills the merchant, amount and date so nothing slips through.",
  },
  {
    icon: Sparkles,
    title: "AI categorization",
    copy: "Every expense is sorted into the right category the moment it lands — no manual tagging.",
  },
  {
    icon: TrendingUp,
    title: "Smart forecasts",
    copy: "ExpenseAI predicts next month's spend per category, so you see the future before it bills you.",
  },
  {
    icon: ShieldAlert,
    title: "Anomaly detection",
    copy: "Unusual spikes and duplicate charges get flagged instantly. Catch surprises early.",
  },
  {
    icon: Wallet,
    title: "Monthly insights",
    copy: "A clear digest of where your money went and what changed — delivered, not dug up.",
  },
  {
    icon: BellRing,
    title: "Overspend alerts",
    copy: "Gentle nudges before you cross a category budget, not after the damage is done.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Camera,
    title: "Connect & add",
    copy: "Add expenses manually in seconds or scan a receipt — ExpenseAI does the typing.",
  },
  {
    num: "02",
    icon: BrainCircuit,
    title: "AI organizes",
    copy: "Transactions are categorized, anomalies flagged, and patterns mapped automatically.",
  },
  {
    num: "03",
    icon: PieChart,
    title: "Forecast & save",
    copy: "See next month before it happens and steer spending with confidence.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to dread month-end reconciliation. ExpenseAI scans my receipts and tells me where my salary actually went — in seconds.",
    name: "Priya Nair",
    role: "Product Designer · Bengaluru",
    initials: "PN",
    color: "from-indigo-500 to-violet-500",
  },
  {
    quote:
      "The forecast feature is eerily accurate. It predicted my food delivery spend within a few hundred rupees. I've cut it by a fifth.",
    name: "Rohan Mehta",
    role: "Founder · Mumbai",
    initials: "RM",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    quote:
      "As a CA I see every expense app out there. This is the first one whose anomaly flags genuinely saved my client real money.",
    name: "Ananya Iyer",
    role: "CA · Chennai",
    initials: "AI",
    color: "from-fuchsia-500 to-pink-500",
  },
];

const FAQS = [
  {
    q: "Is ExpenseAI really free?",
    a: "Yes. The core experience — unlimited expense tracking, receipt scanning, AI categorization and forecasts — is free forever, with no credit card required. Premium plans for power users are coming soon.",
  },
  {
    q: "How does receipt scanning work?",
    a: "Snap a photo of any receipt and ExpenseAI's OCR reads the merchant, amount, date and line items, then files it under the right category. Most receipts are processed in a few seconds.",
  },
  {
    q: "Is my financial data private?",
    a: "Your data belongs to you. It's encrypted in transit and at rest, never sold, and never used for advertising. You can export or delete everything at any time.",
  },
  {
    q: "Which banks are supported?",
    a: "Today you add expenses manually or by scanning receipts — which works with every bank and every UPI app. Secure bank sync is on the roadmap and coming soon.",
  },
  {
    q: "Can I export my data?",
    a: "Absolutely. Export any date range as CSV whenever you like. No lock-in, no hoops — your records are yours.",
  },
];

/* ------------------------------ small components ------------------------------ */

function SectionHeading({ eyebrow, title, copy, align = "center" }) {
  return (
    <div
      className={`mx-auto max-w-2xl ${align === "center" ? "text-center" : "text-left"}`}
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300"
      >
        <Zap size={12} />
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, delay: 0.08 }}
        className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
      >
        {title}
      </motion.h2>
      {copy && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-400"
        >
          {copy}
        </motion.p>
      )}
    </div>
  );
}

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display font-semibold text-slate-900 dark:text-white">
          {faq.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-slate-500 dark:text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-slate-900/95">
      {label && (
        <p className="mb-1 font-semibold text-slate-900 dark:text-white">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-600 dark:text-slate-400">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.payload?.fill }}
          />
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* --------------------------------- main page --------------------------------- */

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="relative overflow-hidden bg-white text-slate-900 dark:bg-[#080810] dark:text-slate-100">
      {/* ================================ HERO ================================ */}
      <section className="relative">
        {/* gradient mesh background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-[120px] dark:bg-indigo-600/30" />
          <div className="absolute top-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-violet-500/20 blur-[110px] dark:bg-violet-600/25" />
          <div className="absolute top-64 -right-32 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/20 blur-[110px] dark:bg-fuchsia-600/25" />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.5]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(100 116 139 / 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgb(100 116 139 / 0.14) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8 lg:pb-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300"
              >
                <Sparkles size={14} />
                AI-powered expense tracking
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Know where your money{" "}
                <span className="text-gradient">actually</span> goes.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto mt-6 max-w-xl text-lg text-slate-600 sm:text-xl lg:mx-0 dark:text-slate-400"
              >
                Snap receipts, let AI categorize every rupee, and see next
                month's spending before it happens. Expense tracking that
                finally keeps up with you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center"
              >
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start free
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/login?demo=1">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Play size={18} />
                    Try the live demo
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-4 text-sm text-slate-500 dark:text-slate-500"
              >
                Free forever · No credit card
              </motion.p>
            </div>

            {/* Right: floating dashboard mock */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              <div
                className={
                  reduceMotion
                    ? ""
                    : "animate-float"
                }
              >
                <div className="glass relative rounded-3xl border border-slate-200/60 p-5 shadow-2xl shadow-indigo-600/10 sm:p-6 dark:border-white/10 dark:shadow-black/40">
                  {/* header row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        September spend
                      </p>
                      <p className="font-display mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        {formatINR(37740)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={13} />
                      6% less
                    </span>
                  </div>

                  {/* mini area chart */}
                  <div className="mt-4 h-36 sm:h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={DASHBOARD_SERIES}
                        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="heroSpend"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          content={<ChartTooltip formatter={(v) => formatINR(v)} />}
                          cursor={{ stroke: "#8b5cf6", strokeOpacity: 0.3 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="spend"
                          stroke="#8b5cf6"
                          strokeWidth={2.5}
                          fill="url(#heroSpend)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* category rows */}
                  <div className="mt-4 space-y-3">
                    {DASHBOARD_CATEGORIES.map((c) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: c.color }}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatINR(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* floating receipt toast */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className={`absolute -left-4 -top-10 hidden sm:block md:-left-10 ${reduceMotion ? "" : "animate-float-slow"}`}
              >
                <div className="glass flex items-center gap-3 rounded-2xl border border-slate-200/60 px-4 py-3 shadow-xl shadow-indigo-600/10 dark:border-white/10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Receipt scanned
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Swiggy · {formatINR(649)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* floating anomaly chip */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className={`absolute -bottom-8 -right-3 hidden sm:block md:-right-8 ${reduceMotion ? "" : "animate-float"}`}
              >
                <div className="glass flex items-center gap-2.5 rounded-2xl border border-amber-500/30 px-4 py-3 shadow-xl shadow-amber-500/10">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Anomaly flagged
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dining up 42% this week
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================ LOGO STRIP ============================ */}
      <section className="border-y border-slate-200/60 py-8 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
            Tracks spending from the places you actually shop
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {MERCHANTS.map((m, i) => (
              <motion.span
                key={m}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="font-display text-lg font-bold tracking-tight text-slate-400/80 transition-colors hover:text-slate-600 sm:text-xl dark:text-slate-600 dark:hover:text-slate-400"
              >
                {m}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title={
              <>
                Everything your money does,{" "}
                <span className="text-gradient">finally visible</span>
              </>
            }
            copy="ExpenseAI combines receipt OCR, smart categorization and forecasting into one effortless flow."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              >
                <Card hover className="h-full p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/25">
                    <f.icon size={22} />
                  </span>
                  <h3 className="font-display mt-5 text-lg font-bold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.copy}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section id="how" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                From chaos to clarity in{" "}
                <span className="text-gradient">three steps</span>
              </>
            }
            copy="No spreadsheets, no manual bookkeeping. Just add, and let the AI do the rest."
          />
          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            {/* connecting line (desktop) */}
            <div
              aria-hidden
              className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-indigo-500/10 via-violet-500/50 to-fuchsia-500/10 md:block"
            />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-xl shadow-indigo-600/25">
                  <s.icon size={26} />
                </div>
                <p className="font-display mt-5 text-sm font-bold tracking-[0.2em] text-gradient">
                  {s.num}
                </p>
                <h3 className="font-display mt-2 text-xl font-bold tracking-tight">
                  {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {s.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= FORECAST SHOWCASE ======================= */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* copy */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                <TrendingUp size={12} />
                Smart forecasts
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                See <span className="text-gradient">next month</span> before it
                happens
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                ExpenseAI learns your spending rhythm and predicts next month's
                total for every category — so you can adjust plans, set smarter
                budgets, and never be blindsided by a bill again.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Per-category predictions updated daily",
                  "Confidence bands that respect irregular spend",
                  "Budget suggestions based on your own patterns",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm sm:text-base">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check size={14} />
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-8 inline-block">
                <Button size="lg">
                  Get my forecast
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </motion.div>

            {/* chart card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="glass relative rounded-3xl border border-slate-200/60 p-5 shadow-2xl shadow-indigo-600/10 sm:p-7 dark:border-white/10">
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30">
                  <Sparkles size={12} />
                  Personalized for you
                </span>
                <h3 className="font-display text-lg font-bold tracking-tight">
                  October forecast
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Last month vs. AI prediction, by category
                </p>
                <div className="mt-4 h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={FORECAST_DATA}
                      margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                      barGap={4}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-slate-200 dark:text-white/10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="cat"
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip
                            formatter={(v) => formatINR(v)}
                          />
                        }
                        cursor={{ fill: "currentColor", opacity: 0.05 }}
                      />
                      <Bar
                        dataKey="actual"
                        name="Last month"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="predicted"
                        name="Predicted"
                        fill="#e879f9"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    Last month
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                    AI predicted
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================ TESTIMONIALS ============================ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Loved by users"
            title={
              <>
                People who stopped <span className="text-gradient">guessing</span>
              </>
            }
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="flex h-full flex-col p-6">
                  <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg
                        key={s}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    "{t.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-white ${t.color}`}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title={
              <>
                Questions? <span className="text-gradient">Answered.</span>
              </>
            }
          />
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <FaqItem
                  faq={faq}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== BIG CTA ============================== */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center shadow-2xl shadow-indigo-600/30 sm:px-12 sm:py-20"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-black/15 blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Stop guessing. Start knowing.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
                Join thousands who finally understand where their money goes.
                Free forever — set up in under a minute.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full bg-white text-indigo-700 shadow-xl hover:bg-indigo-50 sm:w-auto"
                  >
                    Start free
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/login?demo=1">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full text-white hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    <Play size={18} />
                    Try the live demo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================ FOOTER ================================ */}
      <footer className="border-t border-slate-200/60 py-12 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo size="md" />
              <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Know where your money actually goes.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
                Product
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Features", "Forecasts", "Pricing"].map((l) => (
                  <li key={l}>
                    <a href="/#features" className="transition-colors hover:text-indigo-500">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["About", "Blog", "Contact"].map((l) => (
                  <li key={l}>
                    <a href="/#" className="transition-colors hover:text-indigo-500">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
                Legal
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {["Privacy", "Terms"].map((l) => (
                  <li key={l}>
                    <a href="/#" className="transition-colors hover:text-indigo-500">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-200/60 pt-6 text-center text-sm text-slate-500 dark:border-white/5 dark:text-slate-500">
            © 2026 ExpenseAI
          </div>
        </div>
      </footer>
    </div>
  );
}
