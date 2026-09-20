import { useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useCategoryStore } from "../store/categoryStore";
import { useForecastStore } from "../store/forecastStore";

function Forecasts() {
  const { categories, fetchCategories } = useCategoryStore();
  const { forecasts, loading, fetchForecastsForCategories } =
    useForecastStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchForecastsForCategories(categories.map((c) => c.id));
    }
  }, [categories]);

  // reshape forecast data into what Recharts expects: one object per bar-group
  const chartData = forecasts.map((f) => {
    const category = categories.find((c) => c.id === f.category_id);
    return {
      name: category ? category.name : `Category ${f.category_id}`,
      lastMonth: f.based_on?.spend_last_month ?? 0,
      predicted: f.predicted_amount ?? 0,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Forecasts</h1>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading forecasts...</p>
        ) : chartData.length === 0 ? (
          <p className="text-gray-500 text-sm">No forecasts available yet.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Last month vs. predicted next month
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar
                  dataKey="lastMonth"
                  name="Last month"
                  fill="#a5b4fc"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="predicted"
                  name="Predicted"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecasts.map((f, i) => {
            const category = categories.find((c) => c.id === f.category_id);
            const trend =
              f.predicted_amount > (f.based_on?.spend_last_month || 0)
                ? "up"
                : "down";
            return (
              <motion.div
                key={f.category_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white rounded-2xl shadow-sm p-5"
              >
                <p className="text-sm text-gray-500 mb-1">
                  {category ? category.name : `Category ${f.category_id}`}
                </p>
                {f.predicted_amount === null ? (
                  <p className="text-sm text-gray-400 italic">
                    {f.message || "Not enough history to forecast yet."}
                  </p>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-gray-800">
                      ₹{f.predicted_amount.toFixed(2)}
                    </p>
                    {!f.personalized && (
                      <p className="text-xs text-amber-600 mt-1">
                        Estimated from similar users
                      </p>
                    )}
                    {f.personalized && (
                      <p
                        className={`text-sm mt-1 ${
                          trend === "up" ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {trend === "up" ? "↑" : "↓"} vs ₹
                        {(f.based_on?.spend_last_month || 0).toFixed(2)} last
                        month
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Forecasts;
