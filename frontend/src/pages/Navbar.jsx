import { motion, useScroll, useTransform } from "motion/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const { scrollY } = useScroll();
  const animatedBackground = useTransform(
    scrollY,
    [0, 400],
    ["rgba(3, 7, 18, 0.05)", "rgba(3, 7, 18, 0.85)"],
  );

  // Landing: fades in with scroll. Everywhere else: solid from the start.
  const background = isLanding ? animatedBackground : "rgba(3, 7, 18, 1)";

  const isAuthenticated = useAuthStore((state) => !!state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.nav
      style={{ background }}
      className={`fixed top-0 left-0 right-0 z-50 ${isLanding ? "backdrop-blur-sm" : ""}`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-white font-semibold text-lg">
          ExpenseTracker
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Transactions
              </Link>
              <Link
                to="/forecasts"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Forecasts
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-4 py-2 rounded-full text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
