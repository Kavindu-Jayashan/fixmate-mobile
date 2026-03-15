import axios from "axios";
import { Platform } from "react-native";
import storage from "@/lib/storage";

// Android emulator uses 10.0.2.2 to reach host localhost
const DEFAULT_URL = Platform.OS === "android"
  ? "http://10.0.2.2:8081"
  : "http://localhost:8081";

const api = axios.create({
  baseURL: DEFAULT_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach JWT ─────────────────
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem("token");
      await storage.removeItem("role");
      // navigation redirect is handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
