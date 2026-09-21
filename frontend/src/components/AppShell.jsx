import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Tags,
  TrendingUp,
} from "lucide-react";
import Logo from "./Logo";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { toast } from "../store/toastStore";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", Icon: ArrowLeftRight, end: true },
  { to: "/transactions/new", label: "Add", Icon: CirclePlus, end: true },
  { to: "/forecasts", label: "Forecasts", Icon: TrendingUp, end: true },
  { to: "/categories", label: "Categories", Icon: Tags, end: true },
];

const SIDEBAR_LINK_BASE =
  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all";
const SIDEBAR_LINK_ACTIVE =
  "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25";
const SIDEBAR_LINK_IDLE =
  "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white";

function ThemeToggleButton({ className = "", withLabel = false }) {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {withLabel && (
        <span className="text-sm font-medium">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.name || user?.email || "User";
  const email = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    toast.info("Signed out");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-ink-950 dark:text-slate-100">
      {/* decorative background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-indigo-500/10 to-violet-500/5 blur-3xl" />
      </div>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-[#12121c]/80">
        <div className="px-5 pt-6">
          <Logo />
        </div>
        <nav className="mt-8 flex-1 space-y-1 px-3" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${SIDEBAR_LINK_BASE} ${isActive ? SIDEBAR_LINK_ACTIVE : SIDEBAR_LINK_IDLE}`
              }
            >
              <item.Icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-200/70 p-4 dark:border-white/10">
          <ThemeToggleButton
            withLabel
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          />
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="glass fixed inset-x-0 top-0 z-40 border-b border-slate-200/60 lg:hidden dark:border-white/10">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo size="sm" />
          <ThemeToggleButton className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" />
        </div>
      </header>

      {/* content */}
      <div className="relative lg:pl-[260px]">
        <div className="min-h-screen px-4 pb-24 pt-16 sm:px-6 lg:pb-10 lg:pt-0">
          <main className="mx-auto w-full max-w-6xl pt-6 lg:pt-8">{children}</main>
        </div>
      </div>

      {/* mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-white/10"
      >
        <div className="flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                }`
              }
            >
              <item.Icon size={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
