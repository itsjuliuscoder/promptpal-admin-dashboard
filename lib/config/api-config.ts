const isProd = process.env.NODE_ENV === "production";

const API_BASE_URL = isProd
  ? "https://promptpal-backend-service.onrender.com/api"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:9002/api";

export { API_BASE_URL };
export default API_BASE_URL;
