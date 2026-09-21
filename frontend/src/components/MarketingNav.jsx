import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import Logo from "./Logo";
import { Button } from "./ui";
import { useThemeStore } from "../store/themeStore";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "FAQ", href: "/#faq" },
];

export default function MarketingNav() {
  const navigate = useNavigate();
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <header className="glass sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="ExpenseAI home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Marketing">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Log in
          </Button>
          <Button size="sm" onClick={() => navigate("/register")}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
