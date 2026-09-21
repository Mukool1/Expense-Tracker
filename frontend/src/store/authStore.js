import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { setDemoMode, isDemoMode } from "../demo/demoAdapter";
import { demoUser } from "../demo/mockData";

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

      // instant demo session — no network call; flips on the demo-mode flag
      // so the API client serves the local dataset from then on
      loginDemo: () => {
        setDemoMode(true);
        set({ token: "demo-jwt-token", user: { ...demoUser } });
      },

      logout: () => {
        setDemoMode(false);
        set({ token: null, user: null });
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage", // localStorage key — this is what makes login persist across refreshes
    },
  ),
);

// ---------------------------------------------------------------------------
// Demo auto-auth, synchronously at module load (before first render).
// Doing this in a useEffect is too late: ProtectedRoute would bounce an
// unauthenticated first paint to /login, and Login would then forward the
// fresh demo session to /dashboard — losing the original deep link.
// ---------------------------------------------------------------------------
if (isDemoMode() && !useAuthStore.getState().token) {
  useAuthStore.getState().loginDemo();
}
