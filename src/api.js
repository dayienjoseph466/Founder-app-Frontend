// src/api.js
const DEV_DEFAULT = "http://localhost:4000";
const PROD_DEFAULT = "https://founder-app-backend.onrender.com";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? DEV_DEFAULT
    : PROD_DEFAULT);

export function authHeader() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
