import { create } from "zustand";
import client from "../api/client";

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,

  fetchTransactions: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await client.get("/transactions/", { params });
      set({ transactions: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    await client.delete(`/transactions/${id}`);
    // update local state immediately instead of re-fetching the whole list
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },
}));
