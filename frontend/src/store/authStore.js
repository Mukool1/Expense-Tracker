import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const form = new URLSearchParams();
        form.append("username", email);
        form.append("password", password);

        const res = await axios.post(
          "http://localhost:8000/api/auth/login",
          form,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );

        set({ token: res.data.access_token, user: { email } });
      },

      register: async (email, password) => {
        await axios.post("http://localhost:8000/api/auth/register", {
          email,
          password,
        });
        // registering doesn't log the user in automatically — call login() after, on the page
      },

      logout: () => set({ token: null, user: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage", // localStorage key — this is what makes login persist across refreshes
    },
  ),
);
