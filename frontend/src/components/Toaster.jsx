import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore } from "../store/toastStore";

const TYPE_META = {
  success: { Icon: CheckCircle2, iconClass: "text-green-500" },
  error: { Icon: AlertCircle, iconClass: "text-red-500" },
  info: { Icon: Info, iconClass: "text-indigo-500" },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const meta = TYPE_META[t.type] || TYPE_META.info;
          const Icon = meta.Icon;
          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="glass pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200/70 p-3.5 shadow-xl dark:border-white/10"
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${meta.iconClass}`} />
              <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
