import axios, { AxiosError } from "axios";
import API_BASE_URL from "./api-config";

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";

axios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const data = error.response.data as { message?: string } | undefined;
      const msg = data?.message ?? "";
      const isAuthFailure =
        msg === "Access denied. No token provided." ||
        msg === "Invalid token.";
      if (isAuthFailure && typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_profile");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
