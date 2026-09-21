import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";

/* ---------------------------------- Button --------------------------------- */

const BUTTON_VARIANTS = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25",
  secondary:
    "bg-slate-900/5 text-slate-900 hover:bg-slate-900/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
  outline:
    "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white",
  danger: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/25",
};

const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type={props.type || "button"}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className = "", hover = false, children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] ${hover ? "card-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------ Form controls ------------------------------ */

const FIELD_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:option:text-slate-100 option:text-slate-900";

export function Input({ className = "", ...props }) {
  return <input className={`${FIELD_CLASSES} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${FIELD_CLASSES} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${FIELD_CLASSES} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, error, hint, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

const BADGE_TONES = {
  gray: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  indigo:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export function Badge({ tone = "gray", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone] || BADGE_TONES.gray} ${className}`}
    >
      {children}
    </span>
  );
}

/* ----------------------------------- Stat ---------------------------------- */

const STAT_ACCENTS = {
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  fuchsia:
    "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
  green: "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent = "indigo",
  className = "",
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STAT_ACCENTS[accent] || STAT_ACCENTS.indigo}`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[90vh] w-full flex-col rounded-t-3xl border border-slate-200/70 bg-white shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-[#16161f] ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => onClose?.()}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-200/70 px-5 py-4 dark:border-white/10">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-white/10 ${className}`}
    />
  );
}

/* -------------------------------- EmptyState -------------------------------- */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-500/10">
          <Icon size={26} />
        </div>
      )}
      <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------- PageHeader -------------------------------- */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ----------------------------- SegmentedControl ----------------------------- */

export function SegmentedControl({ options, value, onChange }) {
  const id = useId();
  const layoutId = `seg-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 p-1 dark:bg-white/5">
      {options.map((opt) => {
        const active = opt.value === value;
        const OptIcon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {OptIcon && <OptIcon size={14} />}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
