// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");

  if (!token) return <Navigate to="/login" replace />;
  const role = me?.role;
  const allowed = role === "ADMIN" || role === "CEO";

  if (!allowed) return <Navigate to="/dashboard" replace />;
  return children;
}
