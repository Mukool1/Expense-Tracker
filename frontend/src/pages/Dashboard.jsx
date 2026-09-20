import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useCategoryStore } from "../store/categoryStore";
import { useTransactionStore } from "../store/transactionStore";
import { useForecastStore } from "../store/forecastStore";

function Dashboard() {
  const { categories, fetchCategories } = useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { totalPredicted, fetchForecastsForCategories } = useForecastStore();

  useEffect(() => {
    fetchCategories();
    fetchTransactions({ page: 1, limit: 5 });
  }, []);

  // separate effect: only run once categories have actually loaded
  useEffect(() => {
    if (categories.length > 0) {
      fetchForecastsForCategories(categories.map((c) => c.id));
    }
  }, [categories]);

  const totalThisMonth = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center mb-8"
          >
            <p className="text-indigo-700 font-medium mb-1">
              Welcome! Let's get you set up.
            </p>
            <p className="text-indigo-600 text-sm mb-4">
              Add your first transaction to start tracking spend.
            </p>
            <Link
              to="/transactions/new"
              className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              Add Transaction
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SummaryCard
              label="Recent spend"
              value={`₹${totalThisMonth.toFixed(2)}`}
            />
            <SummaryCard
              label="Predicted next month"
              value={`₹${totalPredicted.toFixed(2)}`}
            />
            <SummaryCard label="Categories tracked" value={categories.length} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Recent transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-gray-800">{tx.merchant || "Unnamed"}</p>
                    <p className="text-sm text-gray-500">
                      {tx.category.name} · {tx.transaction_date}
                    </p>
                  </div>
                  <p className="font-medium text-gray-800">
                    ₹{parseFloat(tx.amount).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
    </motion.div>
  );
}

export default Dashboard;
