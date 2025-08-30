export const API_URL = "http://localhost:4000";

export function authHeader(){
  const t = localStorage.getItem("token");
  return t ? { Authorization: "Bearer " + t } : {};
}
