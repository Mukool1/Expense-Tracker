import { todayISO } from "../lib/format.js";

export const demoUser = {
  name: "Aarav Sharma",
  email: "aarav@demo.expenseai.app",
};

const CATEGORY_NAMES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Health",
  "Travel",
];

export const demoCategories = CATEGORY_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  is_default: true,
  user_id: null,
}));

const byId = Object.fromEntries(demoCategories.map((c) => [c.id, c]));

/** Deterministic PRNG so the demo dataset is identical on every load. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local "YYYY-MM-DD" helper: `d(monthsBack, day)` — clamps day to the month,
 *  and for the current month clamps to today so demo data never lands in the future. */
function d(monthsBack, day) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  let maxDay = lastDay;
  if (monthsBack === 0) maxDay = Math.min(lastDay, now.getDate());
  const dd = String(Math.min(Math.max(day, 1), maxDay)).padStart(2, "0");
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  return `${target.getFullYear()}-${mm}-${dd}`;
}

// [categoryId, merchant, minAmount, maxAmount, timesPerMonth]
const MONTHLY_PLAN = [
  [1, "Swiggy", 280, 850, 2],
  [1, "Zomato", 300, 800, 2],
  [1, "Domino's", 500, 1100, 1],
  [2, "BigBasket", 1800, 4200, 1],
  [2, "DMart", 1200, 2800, 1],
  [2, "Blinkit", 400, 1100, 1],
  [3, "Uber", 180, 700, 2],
  [3, "Ola", 170, 680, 1],
  [3, "Metro Card Recharge", 500, 1000, 1],
  [4, "Amazon.in", 1200, 6000, 1],
  [4, "Myntra", 1500, 5500, 1],
  [4, "Croma", 3000, 12000, 1],
  [5, "BookMyShow", 600, 1800, 1],
  [5, "Netflix", 649, 649, 1],
  [6, "Jio Prepaid", 349, 399, 1],
  [6, "BESCOM Electricity", 1600, 3200, 1],
  [7, "Apollo Pharmacy", 500, 2200, 1],
  [8, "IRCTC", 1000, 3200, 1],
];

// Rotating big-ticket travel purchase, one per month
const BIG_TRAVEL = [
  [8, "IndiGo", 5200, 11500],
  [8, "MakeMyTrip", 7500, 16000],
];

// Per-month spend factor (monthsBack 0..5); anomaly months run slightly lighter
const MONTH_FACTORS = [1.12, 0.85, 0.85, 0.8, 1.05, 1.1];

function buildTransactions() {
  const rand = mulberry32(20260921);
  const txns = [];
  let id = 1;

  const pickDay = () => 1 + Math.floor(rand() * 28);
  const pickAmount = (min, max, factor) => Math.round((min + rand() * (max - min)) * factor);
  const pickTime = () => {
    const h = String(8 + Math.floor(rand() * 14)).padStart(2, "0");
    const m = String(Math.floor(rand() * 60)).padStart(2, "0");
    return `${h}:${m}:00`;
  };
  const makeTxn = (catId, merchant, amount, date) => ({
    id: id++,
    amount,
    merchant,
    transaction_date: date,
    source: rand() < 0.3 ? "scan" : "manual",
    created_at: `${date}T${pickTime()}`,
    category: { ...byId[catId] },
    is_anomaly: false,
    anomaly_score: 0,
  });

  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    const factor = MONTH_FACTORS[monthsBack];
    for (const [catId, merchant, min, max, count] of MONTHLY_PLAN) {
      for (let i = 0; i < count; i++) {
        txns.push(makeTxn(catId, merchant, pickAmount(min, max, factor), d(monthsBack, pickDay())));
      }
    }
    const [tCat, tMerchant, tMin, tMax] = BIG_TRAVEL[monthsBack % BIG_TRAVEL.length];
    txns.push(makeTxn(tCat, tMerchant, pickAmount(tMin, tMax, factor), d(monthsBack, pickDay())));
  }

  // Flag a few genuine outliers as anomalies (replace the regular purchase)
  const anomalies = [
    { monthsBack: 0, merchant: "Croma", amount: 48990, score: 0.94 },
    { monthsBack: 1, merchant: "MakeMyTrip", amount: 32400, score: 0.88 },
    { monthsBack: 2, merchant: "Amazon.in", amount: 24999, score: 0.85 },
    { monthsBack: 4, merchant: "Apollo Pharmacy", amount: 9850, score: 0.81 },
  ];
  for (const a of anomalies) {
    const prefix = d(a.monthsBack, 15).slice(0, 7);
    const txn = txns.find(
      (t) => !t.is_anomaly && t.merchant === a.merchant && t.transaction_date.startsWith(prefix),
    );
    if (txn) {
      txn.amount = a.amount;
      txn.is_anomaly = true;
      txn.anomaly_score = a.score;
      txn.source = "manual";
    }
  }

  txns.sort(
    (a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id,
  );
  return txns;
}

export const demoTransactions = buildTransactions();

/** Forecasts derived from the demo transactions, keyed by category id. */
function monthlyTotals(catId) {
  const totals = [];
  for (let m = 0; m < 6; m++) {
    const prefix = d(m, 15).slice(0, 7);
    totals.push(
      demoTransactions
        .filter((t) => t.category.id === catId && t.transaction_date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0),
    );
  }
  return totals; // index 0 = current month
}

const PERSONALIZED = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 7: true, 8: false };

export const demoForecasts = {};
for (const c of demoCategories) {
  const totals = monthlyTotals(c.id);
  const avg3 = Math.round(totals.slice(0, 3).reduce((s, v) => s + v, 0) / 3);
  const avg6 = Math.round(totals.reduce((s, v) => s + v, 0) / 6);
  const personalized = PERSONALIZED[c.id] ?? true;
  const variation = 0.96 + ((c.id * 7) % 9) / 100; // deterministic 0.96–1.04
  demoForecasts[c.id] = {
    category_id: c.id,
    predicted_amount: Math.round(avg3 * variation),
    personalized,
    based_on: {
      spend_last_month: totals[0],
      spend_avg_3mo: avg3,
      spend_avg_6mo: avg6,
    },
    message: personalized
      ? "Based on your last 6 months of spending."
      : "Estimated from users with similar spending patterns.",
  };
}

export const demoScanResults = [
  {
    suggested_merchant: "Swiggy",
    suggested_amount: 649.0,
    suggested_date: todayISO(),
    parsed_confidence: 0.93,
    image_url: null,
    raw_ocr_text:
      "SWIGGY\nOrder #8741209356\n2x Paneer Butter Masala  Rs. 398.00\n1x Garlic Naan (2 pc)  Rs. 99.00\nDelivery fee  Rs. 45.00\nPackaging  Rs. 12.00\nGST  Rs. 95.00\nTOTAL  Rs. 649.00\nPaid via UPI",
  },
  {
    suggested_merchant: "DMart",
    suggested_amount: 2349.5,
    suggested_date: todayISO(),
    parsed_confidence: 0.88,
    image_url: null,
    raw_ocr_text:
      "DMART - AVENUE SUPERMARTS\nBill No: 45231  Date: today\nAtta 5kg  289.00\nBasmati Rice 5kg  649.00\nToor Dal 2kg  318.50\nSunflower Oil 5L  745.00\nSugar 2kg  96.00\nTea 500g  252.00\nTOTAL  Rs. 2349.50",
  },
  {
    suggested_merchant: "Uber",
    suggested_amount: 342.0,
    suggested_date: todayISO(),
    parsed_confidence: 0.96,
    image_url: null,
    raw_ocr_text:
      "UBER INDIA\nTrip Receipt\nUberGo - 14.2 km, 32 min\nBase fare  Rs. 68.00\nDistance  Rs. 198.00\nTime  Rs. 41.00\nBooking fee  Rs. 35.00\nTOTAL  Rs. 342.00\nCharged to UPI",
  },
];
