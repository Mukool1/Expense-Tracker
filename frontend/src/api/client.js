import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { isDemoMode, createDemoAdapter } from "../demo/demoAdapter";

const client = axios.create({
  baseURL: "http://localhost:8000/api",
});

// runs before every request — attaches the JWT automatically if we're logged in.
// In demo mode the request never leaves the browser: a demo adapter serves
// canned data instead (state lives at module level in demoAdapter.js, so a
// fresh adapter per request is fine).
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isDemoMode()) {
    config.adapter = createDemoAdapter();
  }
  return config;
});

// runs after every response — if the token's expired/invalid, log the user out
// globally. Skipped in demo mode: demo responses never carry a real 401.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isDemoMode()) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default client;
