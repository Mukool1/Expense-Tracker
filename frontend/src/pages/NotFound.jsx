import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Ghost, Home, LayoutDashboard } from "lucide-react";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          animate={{ y: [0, 24, 0], x: [0, 16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -32, 0], x: [0, -20, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 flex w-full max-w-lg flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="animate-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-xl shadow-indigo-600/30 ring-8 ring-indigo-500/10"
        >
          <Ghost size={38} strokeWidth={2} />
        </motion.div>

        <h1 className="text-gradient mt-8 font-display text-7xl font-bold tracking-tight sm:text-8xl">
          404
        </h1>
        <h2 className="mt-4 font-display text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          This page went missing like that ₹500 note.
        </h2>
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          It was here a second ago — at least that's what it claims. Let's get
          you back to money you can actually track.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Home size={16} />
              Back home
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <LayoutDashboard size={16} />
              Go to dashboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
