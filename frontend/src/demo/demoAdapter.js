import {
  demoCategories,
  demoTransactions,
  demoForecasts,
  demoScanResults,
} from "./mockData.js";
import { todayISO } from "../lib/format.js";

/**
 * Demo mode detection. True when ANY of:
 * - localStorage flag "expenseai_demo" === "1"
 * - URL query param ?demo=1
 * - Vite env VITE_DEMO === "true"
 * Safe to call in non-browser environments (returns false there).
 */
export function isDemoMode() {
  const inBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";
  if (inBrowser) {
    try {
      if (localStorage.getItem("expenseai_demo") === "1") return true;
    } catch {
      /* storage unavailable */
    }
    try {
      if (new URLSearchParams(window.location.search).get("demo") === "1") return true;
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_DEMO === "true") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Turn the demo-mode localStorage flag on/off. No-op outside the browser. */
export function setDemoMode(on) {
  if (typeof localStorage === "undefined") return;
  try {
    if (on) localStorage.setItem("expenseai_demo", "1");
    else localStorage.removeItem("expenseai_demo");
  } catch {
    /* storage unavailable */
  }
}

// ---------------------------------------------------------------------------
// Module-level mutable demo state. createDemoAdapter() returns a fresh adapter
// per request, but they all share this state, so writes persist across calls.
// NOTE: this module must never import client.js or any zustand store —
// client.js imports this module, so that would be an import cycle.
// ---------------------------------------------------------------------------

let categories = structuredClone(demoCategories);
let transactions = structuredClone(demoTransactions);
const scanTasks = new Map();
let scanCounter = 0;

const latency = () =>
  new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

function ok(config, data, status = 200) {
  return {
    data,
    status,
    statusText: status === 201 ? "Created" : status === 204 ? "No Content" : "OK",
    headers: {},
    config,
  };
}

function fail(config, status, detail) {
  const err = new Error(detail);
  err.response = { status, data: { detail }, headers: {}, config };
  err.config = config;
  throw err;
}

function parseBody(config) {
  const raw = config.data;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof URLSearchParams !== "undefined" && raw instanceof URLSearchParams) {
    return Object.fromEntries(raw.entries());
  }
  return raw;
}

/** Extract a numeric id from paths like "/things/12" or "/things/12/". */
function idFrom(path, prefix) {
  const m = path.match(new RegExp(`^${prefix}/(\\d+)/?$`));
  return m ? Number(m[1]) : null;
}

/** Axios adapter that serves the demo dataset instead of hitting the API. */
export function createDemoAdapter() {
  return async (config) => {
    await latency();

    const method = (config.method || "get").toLowerCase();
    const path = String(config.url || "").split("?")[0];
    const params = config.params || {};
    const body = parseBody(config);

    // ---- auth ----
    if (method === "post" && path === "/auth/register") {
      return ok(config, { id: 1, email: body.email || "demo@expenseai.app" }, 201);
    }
    if (method === "post" && path === "/auth/login") {
      return ok(config, { access_token: "demo-jwt-token", token_type: "bearer" });
    }

    // ---- categories ----
    if (method === "get" && (path === "/categories" || path === "/categories/")) {
      return ok(config, categories);
    }
    if (method === "post" && (path === "/categories" || path === "/categories/")) {
      const name = (body.name || "").toString().trim();
      if (!name) fail(config, 422, "Category name is required.");
      const nextId = categories.reduce((m, c) => Math.max(m, c.id), 0) + 1;
      const created = { id: nextId, name, is_default: false, user_id: 1 };
      categories.push(created);
      return ok(config, created, 201);
    }
    const delCatId = method === "delete" ? idFrom(path, "/categories") : null;
    if (delCatId !== null) {
      const idx = categories.findIndex((c) => c.id === delCatId);
      if (idx === -1) fail(config, 404, "Category not found.");
      if (transactions.some((t) => t.category && t.category.id === delCatId)) {
        fail(config, 409, "Cannot delete category with existing transactions.");
      }
      if (categories[idx].is_default) {
        fail(config, 403, "Default categories cannot be deleted.");
      }
      categories.splice(idx, 1);
      return ok(config, null, 204);
    }

    // ---- transactions ----
    if (method === "get" && (path === "/transactions" || path === "/transactions/")) {
      let list = [...transactions];
      if (params.search) {
        const q = String(params.search).trim().toLowerCase();
        if (q) {
          list = list.filter(
            (t) =>
              (t.merchant || "").toLowerCase().includes(q) ||
              (t.category?.name || "").toLowerCase().includes(q),
          );
        }
      }
      if (params.category_id != null && params.category_id !== "") {
        const cid = Number(params.category_id);
        list = list.filter((t) => t.category && t.category.id === cid);
      }
      if (params.date_from) {
        list = list.filter((t) => t.transaction_date >= String(params.date_from));
      }
      if (params.date_to) {
        list = list.filter((t) => t.transaction_date <= String(params.date_to));
      }
      list.sort(
        (a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id,
      );
      const page = Math.max(1, Number(params.page) || 1);
      const limit = params.limit != null ? Math.max(1, Number(params.limit)) : list.length;
      const start = (page - 1) * limit;
      return ok(config, list.slice(start, start + limit));
    }
    if (method === "post" && (path === "/transactions" || path === "/transactions/")) {
      const amount = Number(body.amount);
      const merchant = (body.merchant || "").toString().trim();
      const transaction_date = body.transaction_date || todayISO();
      const catId = Number(body.category_id ?? body.category?.id);
      const category = categories.find((c) => c.id === catId);
      if (!category) fail(config, 404, "Category not found.");
      if (!Number.isFinite(amount) || amount <= 0) {
        fail(config, 422, "Amount must be a positive number.");
      }
      if (!merchant) fail(config, 422, "Merchant is required.");
      const peers = transactions
        .filter((t) => t.category && t.category.id === catId)
        .map((t) => t.amount);
      const avg = peers.length ? peers.reduce((s, v) => s + v, 0) / peers.length : 0;
      const is_anomaly = amount > 5000 && amount > 3 * avg;
      const nextId = transactions.reduce((m, t) => Math.max(m, t.id), 0) + 1;
      const created = {
        id: nextId,
        amount: Math.round(amount),
        merchant,
        transaction_date,
        source: "manual",
        created_at: new Date().toISOString(),
        category: { ...category },
        is_anomaly,
        anomaly_score: is_anomaly ? 0.85 : 0,
      };
      transactions.unshift(created);
      return ok(config, created, 201);
    }
    const delTxnId = method === "delete" ? idFrom(path, "/transactions") : null;
    if (delTxnId !== null) {
      const idx = transactions.findIndex((t) => t.id === delTxnId);
      if (idx === -1) fail(config, 404, "Transaction not found.");
      transactions.splice(idx, 1);
      return ok(config, null, 204);
    }

    // ---- receipts ----
    if (method === "post" && path === "/receipts/scan") {
      const task_id = `demo-scan-${Date.now()}`;
      scanTasks.set(task_id, {
        startedAt: Date.now(),
        idx: scanCounter++ % demoScanResults.length,
      });
      return ok(config, { task_id });
    }
    const scanMatch =
      method === "get" ? path.match(/^\/receipts\/scan\/([^/]+)\/?$/) : null;
    if (scanMatch) {
      const task = scanTasks.get(scanMatch[1]);
      if (!task) fail(config, 404, "Scan task not found.");
      if (Date.now() - task.startedAt < 3000) {
        return ok(config, { status: "processing" });
      }
      return ok(config, {
        status: "done",
        result: { ...demoScanResults[task.idx], suggested_date: todayISO() },
      });
    }

    // ---- forecasts ----
    const forecastId = method === "get" ? idFrom(path, "/forecasts") : null;
    if (forecastId !== null) {
      const forecast = demoForecasts[forecastId];
      if (!forecast) fail(config, 404, "No forecast available yet.");
      return ok(config, forecast);
    }

    fail(config, 404, `No demo handler for ${method.toUpperCase()} ${path}`);
  };
}
