import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Check,
  Loader2,
  PenLine,
  Plus,
  ScanLine,
} from "lucide-react";
import client from "../api/client";
import { useCategoryStore } from "../store/categoryStore";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
} from "../components/ui";
import { toast } from "../store/toastStore";
import { cx, todayISO } from "../lib/format";

const SCAN_STEPS = ["Uploading", "Reading text", "Extracting total"];
const STEP_INTERVAL_MS = 1200;
const POLL_INTERVAL_MS = 1500;

const emptyForm = () => ({
  category_id: "",
  amount: "",
  merchant: "",
  transaction_date: todayISO(),
});

// Native <option> elements ignore the <select>'s Tailwind text color in the
// dropdown list — without explicit colors they render white-on-white in dark
// mode. Keep these in sync across every option below.
const OPTION_CLASSES =
  "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100";

function AddTransaction() {
  const { categories, fetchCategories, createCategory } = useCategoryStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(
    searchParams.get("mode") === "scan" ? "scan" : "manual",
  );
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Inline new-category state (shared by both modes via the form).
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Scan state.
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);
  const stepTimersRef = useRef([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Revoke the preview object URL whenever it changes or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Tracks mount status so async scan work never touches state after unmount.
  // NOTE: the setup MUST reset the flag to true — React StrictMode (used in
  // `npm run dev`) runs the effect cleanup on the initial mount too. Without
  // this reset the flag stays false forever and the scan polling silently
  // never starts (the POST still succeeds, so the backend log looks fine).
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      stepTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const clearTimers = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    stepTimersRef.current.forEach((t) => clearTimeout(t));
    stepTimersRef.current = [];
  };

  const resetScan = () => {
    clearTimers();
    setScanning(false);
    setScanResult(null);
    setScanStep(0);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const beginScan = async (file) => {
    if (!file || scanning) return;
    resetScan();
    setError("");
    setScanning(true);
    setScanStep(0);
    setPreviewUrl(URL.createObjectURL(file));

    // Animate the progress steps while the server works.
    SCAN_STEPS.forEach((_, i) => {
      if (i === 0) return;
      stepTimersRef.current.push(
        setTimeout(() => {
          if (mountedRef.current) setScanStep(i);
        }, STEP_INTERVAL_MS * i),
      );
    });

    try {
      const payload = new FormData();
      payload.append("file", file);
      const res = await client.post("/receipts/scan", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!mountedRef.current) return;
      pollForResult(res.data.task_id);
    } catch (err) {
      if (!mountedRef.current) return;
      clearTimers();
      setScanning(false);
      setError(
        err.response?.data?.detail || "Could not start the scan. Try again.",
      );
    }
  };

  const pollForResult = (taskId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await client.get(`/receipts/scan/${taskId}`);
        if (!mountedRef.current) {
          clearInterval(pollTimerRef.current);
          return;
        }
        if (res.data.status === "done") {
          clearTimers();
          const data = res.data.result;
          setScanning(false);
          setScanResult(data);
          setForm({
            category_id: "",
            amount: data.suggested_amount ?? "",
            merchant: data.suggested_merchant ?? "",
            transaction_date: data.suggested_date || todayISO(),
          });
        } else if (res.data.status === "failed") {
          clearTimers();
          setScanning(false);
          setError("");
          toast.error("Receipt processing failed. Try a clearer photo.");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        clearTimers();
        setScanning(false);
        setError(
          err.response?.data?.detail || "Lost connection while scanning.",
        );
      }
    }, POLL_INTERVAL_MS);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) beginScan(file);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const created = await createCategory(name);
      setField("category_id", String(created.id));
      setNewCategoryName("");
      setAddingCategory(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create category.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const amount = parseFloat(form.amount);
    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than ₹0.");
      return;
    }
    setSaving(true);
    try {
      await client.post("/transactions/", {
        category_id: parseInt(form.category_id, 10),
        amount,
        merchant: form.merchant.trim(),
        transaction_date: form.transaction_date,
      });
      toast.success("Transaction added");
      navigate("/transactions");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save the transaction.");
      setSaving(false);
    }
  };

  const confidence = scanResult ? Number(scanResult.parsed_confidence) : null;
  const highConfidence =
    confidence !== null && Number.isFinite(confidence) && confidence >= 0.7;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <PageHeader
          title="Add transaction"
          subtitle="Log it manually or snap a receipt."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mb-6"
      >
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "manual", label: "Manual", icon: PenLine },
            { value: "scan", label: "Scan receipt", icon: ScanLine },
          ]}
        />
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {mode === "scan" && !scanResult && (
          <motion.div
            key="scan-zone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={cx(
                "cursor-pointer border-2 border-dashed p-8 text-center transition-colors",
                dragging
                  ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10"
                  : "border-slate-300 dark:border-white/15",
                scanning && "cursor-default",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={scanning}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) beginScan(file);
                }}
              />
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-56 w-auto rounded-lg border border-slate-200 object-contain dark:border-white/10"
                  />
                  {scanning && (
                    <div className="mt-6 w-full max-w-xs space-y-3">
                      {SCAN_STEPS.map((label, i) => (
                        <div
                          key={label}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          {i < scanStep ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          ) : i === scanStep ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-indigo-600 dark:text-indigo-400"
                            />
                          ) : (
                            <span className="h-5 w-5 rounded-full border-2 border-slate-200 dark:border-white/15" />
                          )}
                          <span
                            className={cx(
                              i <= scanStep
                                ? "font-medium text-slate-800 dark:text-slate-100"
                                : "text-slate-400 dark:text-slate-500",
                            )}
                          >
                            {label}
                            {i === scanStep ? "…" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-500/10">
                    <ScanLine size={26} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Drag &amp; drop a receipt image
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    or click to browse
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {mode === "scan" && scanResult && (
          <motion.div
            key="scan-review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={cx(
                "mb-5 rounded-xl border px-3.5 py-3 text-sm font-medium",
                highConfidence
                  ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
              )}
            >
              {highConfidence
                ? `Scanned with ${Math.round(confidence * 100)}% confidence — double-check before saving`
                : "Low confidence — please verify each field"}
            </div>
            <TransactionForm
              form={form}
              setField={setField}
              categories={categories}
              addingCategory={addingCategory}
              setAddingCategory={setAddingCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              onAddCategory={handleAddCategory}
              onSave={handleSave}
              saving={saving}
            />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={resetScan}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                Scan a different receipt
              </button>
            </div>
          </motion.div>
        )}

        {mode === "manual" && (
          <motion.div
            key="manual-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <TransactionForm
              form={form}
              setField={setField}
              categories={categories}
              addingCategory={addingCategory}
              setAddingCategory={setAddingCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              onAddCategory={handleAddCategory}
              onSave={handleSave}
              saving={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionForm({
  form,
  setField,
  categories,
  addingCategory,
  setAddingCategory,
  newCategoryName,
  setNewCategoryName,
  onAddCategory,
  onSave,
  saving,
}) {
  const handleCategoryChange = (e) => {
    if (e.target.value === "__new__") {
      setAddingCategory(true);
      setField("category_id", "");
    } else {
      setField("category_id", e.target.value);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={onSave} className="space-y-4">
        <Field label="Merchant" htmlFor="tx-merchant">
          <Input
            id="tx-merchant"
            type="text"
            value={form.merchant}
            onChange={(e) => setField("merchant", e.target.value)}
            placeholder="e.g. Cafe Central"
            autoComplete="off"
          />
        </Field>

        <Field label="Amount" htmlFor="tx-amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
              ₹
            </span>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="pl-8"
            />
          </div>
        </Field>

        <Field label="Category" htmlFor="tx-category">
          {categories.length === 0 && !addingCategory ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-white/15">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No categories yet — create your first one to get started.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setAddingCategory(true)}
              >
                <Plus size={14} />
                Create your first category
              </Button>
            </div>
          ) : addingCategory ? (
            <div className="flex gap-2">
              <Input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddCategory();
                  }
                }}
                placeholder="e.g. Groceries"
              />
              <Button type="button" onClick={onAddCategory}>
                Add
              </Button>
            </div>
          ) : (
            <Select
              id="tx-category"
              required
              value={form.category_id}
              onChange={handleCategoryChange}
              className="dark:[color-scheme:dark]"
            >
              <option value="" className={OPTION_CLASSES}>
                Select a category
              </option>
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={String(c.id)}
                  className={OPTION_CLASSES}
                >
                  {c.name}
                </option>
              ))}
              <option value="__new__" className={OPTION_CLASSES}>
                + Add new category
              </option>
            </Select>
          )}
        </Field>

        <Field label="Date" htmlFor="tx-date">
          <Input
            id="tx-date"
            type="date"
            required
            value={form.transaction_date}
            onChange={(e) => setField("transaction_date", e.target.value)}
          />
        </Field>

        <Button type="submit" loading={saving} className="w-full" size="lg">
          {saving ? "Saving…" : "Save transaction"}
        </Button>
      </form>
    </Card>
  );
}

export default AddTransaction;
