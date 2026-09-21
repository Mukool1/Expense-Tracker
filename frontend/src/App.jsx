import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import Forecasts from "./pages/Forecasts";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";
import MarketingNav from "./components/MarketingNav";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Toaster from "./components/Toaster";
import { useThemeStore } from "./store/themeStore";

function Boot() {
  useEffect(() => {
    useThemeStore.getState().initTheme();
    // Note: demo auto-auth happens synchronously in authStore.js at module
    // load, so ProtectedRoute never sees a token-less first paint.
  }, []);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Boot />
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <MarketingNav />
              <Landing />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <MarketingNav />
              <Login />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <MarketingNav />
              <Register />
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppShell>
                <Transactions />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/new"
          element={
            <ProtectedRoute>
              <AppShell>
                <AddTransaction />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecasts"
          element={
            <ProtectedRoute>
              <AppShell>
                <Forecasts />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AppShell>
                <Categories />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <>
              <MarketingNav />
              <NotFound />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
