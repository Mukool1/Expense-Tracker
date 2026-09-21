import { create } from "zustand";
import client from "../api/client";

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const res = await client.get("/categories/");
      set({ categories: res.data, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  deleteCategory: async (id) => {
    await client.delete(`/categories/${id}`);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },
  createCategory: async (name) => {
    const res = await client.post("/categories/", { name });
    set({ categories: [...get().categories, res.data] });
    return res.data;
  },
}));
