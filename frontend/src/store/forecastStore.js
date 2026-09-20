import { create } from "zustand";
import client from "../api/client";

export const useForecastStore = create((set) => ({
  forecasts: [],
  totalPredicted: 0,
  loading: false,

  fetchForecastsForCategories: async (categoryIds) => {
    set({ loading: true });
    try {
      // fire all requests at once instead of one-by-one — much faster for several categories
      const results = await Promise.all(
        categoryIds.map((id) =>
          client.get(`/forecasts/${id}`).then((res) => res.data),
        ),
      );

      const total = results.reduce(
        (sum, f) => sum + (f.predicted_amount || 0),
        0,
      );
      set({ forecasts: results, totalPredicted: total, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
