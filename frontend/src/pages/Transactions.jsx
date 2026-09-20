import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { Link } from "react-router-dom";

function Transactions() {
  const { transactions, loading, fetchTransactions, deleteTransaction } =
    useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const params = { page: 1, limit: 50 };
    if (categoryFilter) params.category_id = categoryFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    fetchTransactions(params);
  }, [categoryFilter, dateFrom, dateTo]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Transactions</h1>
          <Link
            to="/transactions/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Transaction
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No transactions match these filters.
            </p>
          ) : (
            <ul className="divide-y">
              <AnimatePresence>
                {transactions.map((tx) => (
                  <motion.li
                    key={tx.id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-gray-800">
                        {tx.merchant || "Unnamed"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tx.category.name} · {tx.transaction_date}
                        {tx.source === "receipt" && (
                          <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            scanned
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-gray-800">
                        ₹{parseFloat(tx.amount).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transactions;
