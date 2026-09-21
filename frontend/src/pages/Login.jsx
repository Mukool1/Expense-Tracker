import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Quote,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { toast } from "../store/toastStore";
import { Button, Card, Field, Input } from "../components/ui";
import Logo from "../components/Logo";
import { formatINR } from "../lib/format";

const TESTIMONIALS = [
  {
    quote:
      "I finally saw where my money was actually going. Two months in and I'm saving more than ever.",
    name: "Priya S.",
    role: "Product designer, Bengaluru",
  },
  {
    quote:
      "The AI forecasts are scary accurate. It flagged my festive-season spending before it happened.",
    name: "Arjun M.",
    role: "Engineer, Mumbai",
  },
  {
    quote:
      "ExpenseAI made budgeting feel effortless — it categorises everything automatically.",
    name: "Kavya R.",
    role: "Freelancer, Hyderabad",
  },
];

const SPARKLINE = "0,40 24,34 48,37 72,28 96,31 120,22 144,25 168,14 200,16";

function VisualPanel() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setQuoteIndex((i) => (i + 1) % TESTIMONIALS.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  const t = TESTIMONIALS[quoteIndex];

  return (
    <div className="relative hidden min-h-screen w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-fuchsia-950 p-10 lg:flex xl:w-1/2">
      {/* mesh blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="animate-float absolute right-0 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="animate-float-slow absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,8,15,0.55)_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dark relative z-10"
      >
        <Logo size="lg" />
      </motion.div>

      {/* floating glass visual */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="animate-float w-full max-w-sm"
        >
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200/80">
              This month's spend
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="font-display text-4xl font-bold tracking-tight text-white">
                {formatINR(28450)}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                <TrendingDown size={13} />
                12%
              </span>
            </div>
            <svg
              viewBox="0 0 200 48"
              className="mt-4 h-12 w-full"
              aria-hidden="true"
              role="presentation"
            >
              <defs>
                <linearGradient id="login-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`${SPARKLINE} 200,48 0,48`}
                fill="url(#login-spark)"
              />
              <polyline
                points={SPARKLINE}
                fill="none"
                stroke="#e9d5ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-3 text-xs text-indigo-200/70">
              Down 12% vs last month — your AI insights are working.
            </p>
          </div>
        </motion.div>
      </div>

      {/* rotating testimonial */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 min-h-[7.5rem]"
      >
        <Quote size={22} className="text-fuchsia-300/70" />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={quoteIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="mt-2"
          >
            <p className="font-display text-lg leading-snug text-white/90">
              "{t.quote}"
            </p>
            <footer className="mt-2 text-sm text-indigo-200/70">
              <span className="font-semibold text-white/80">{t.name}</span>
              {" — "}
              {t.role}
            </footer>
          </motion.blockquote>
        </AnimatePresence>
        <div className="mt-3 flex gap-1.5">
          {TESTIMONIALS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === quoteIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoDemoDone = useRef(false);

  // ?demo=1 — drop straight into the live demo
  useEffect(() => {
    if (searchParams.get("demo") === "1" && !autoDemoDone.current) {
      autoDemoDone.current = true;
      if (!isAuthenticated()) {
        loginDemo();
        toast.success("Welcome to the demo!");
      }
      navigate("/dashboard", { replace: true });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemo = () => {
    setDemoLoading(true);
    loginDemo();
    toast.success("Welcome to the demo!");
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-ink-950">
      <VisualPanel />

      <div className="flex flex-1 items-center justify-center px-4 py-12 pt-16 sm:px-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 text-center lg:hidden">
            <Logo size="md" />
          </div>

          <Card className="p-6 sm:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Log in to see where your money went.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                  >
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field label="Email" htmlFor="login-email">
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Password" htmlFor="login-password">
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Logging in…" : "Log in"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                or
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              loading={demoLoading}
              onClick={handleDemo}
            >
              {!demoLoading && <Sparkles size={16} />}
              Try the live demo
            </Button>
            <p className="mt-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
              No sign-up needed — explore with sample data.
            </p>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              New here?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Create an account
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
