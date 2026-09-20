import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import client from "../api/client";
import { useCategoryStore } from "../store/categoryStore";

function AddTransaction() {
  const { categories, fetchCategories, createCategory } = useCategoryStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState("manual"); // 'manual' or 'scan'
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    merchant: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await client.post("/receipts/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setScanResult(res.data);
      // pre-fill the form with the model's best guess — user reviews/corrects before saving
      setForm({
        category_id: "",
        amount: res.data.suggested_amount || "",
        merchant: res.data.suggested_merchant || "",
        transaction_date:
          res.data.suggested_date || new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to scan receipt.");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await client.post("/transactions/", {
        ...form,
        amount: parseFloat(form.amount),
        category_id: parseInt(form.category_id),
      });
      navigate("/transactions");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const category = await createCategory(newCategoryName.trim());
    setForm({ ...form, category_id: category.id });
    setNewCategoryName("");
    setAddingCategory(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6 pb-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Add Transaction
        </h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === "manual"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Enter manually
          </button>
          <button
            onClick={() => setMode("scan")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === "scan"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Scan receipt
          </button>
        </div>

        {mode === "scan" && !scanResult && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              disabled={scanning}
              className="text-sm"
            />
            {scanning && (
              <p className="text-sm text-gray-500 mt-3">Reading receipt...</p>
            )}
          </div>
        )}

        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 mb-6 text-sm border ${
              scanResult.parsed_confidence < 0.7
                ? "bg-amber-50 border-amber-200"
                : "bg-indigo-50 border-indigo-100"
            }`}
          >
            <p
              className={
                scanResult.parsed_confidence < 0.7
                  ? "text-amber-800"
                  : "text-indigo-700"
              }
            >
              Scanned with {(scanResult.parsed_confidence * 100).toFixed(0)}%
              confidence — double-check the fields below before saving.
            </p>
            {scanResult.parsed_confidence < 0.7 && (
              <p className="text-sm text-amber-600 mt-2 font-medium">
                Low confidence scan — the image may be unclear. Please fill in
                or correct the fields below.
              </p>
            )}
          </motion.div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}

        {(mode === "manual" || scanResult) && (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
          >
            <div>
              <label className="text-sm text-gray-600">Merchant</label>
              <input
                type="text"
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Category</label>
              {categories.length === 0 && !addingCategory ? (
                <div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
                  <p className="text-amber-700 mb-2">
                    You don't have any categories yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    + Create your first category
                  </button>
                </div>
              ) : addingCategory ? (
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Groceries"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="bg-indigo-600 text-white px-4 rounded-lg text-sm"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setAddingCategory(true);
                    } else {
                      setForm({ ...form, category_id: e.target.value });
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new__">+ Add new category</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Date</label>
              <input
                type="date"
                required
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Transaction"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddTransaction;
