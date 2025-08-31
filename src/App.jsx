// client/src/App.jsx
import React from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import TaskAdmin from "./pages/TaskAdmin";
import AdminDaily from "./pages/AdminDaily";
import Review from "./pages/Review";

import UserLogin from "./pages/UserLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import { ProtectedRoute, AdminRoute } from "./ProtectedRoute";
import "./App.css";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* ─────────────────────────────────────
   Top Navigation Bar (gradient only)
   ───────────────────────────────────── */
function NavBar() {
  const me = JSON.parse(localStorage.getItem("me") || "null");
  const isAdmin = me?.role === "ADMIN" || me?.role === "CEO";

  const loc = useLocation();
  const nav = useNavigate();

  const inAdmin = loc.pathname.startsWith("/admin");
  const onLogin = loc.pathname === "/login" || loc.pathname === "/admin-login";

  function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    nav("/login", { replace: true });
  }

  return (
    <nav
      id="topNav"
      className="siteNav navGradient"
      // INLINE background + color so it wins everything
      style={{
        background: "var(--nav-grad)",
        color: "#4581e9ff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 18px",
      }}
    >
      <div className="brand" aria-label="Founders App" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo.png"
          alt="Founders App logo"
          className="brandLogo"
          draggable="false"
          style={{ height: "60px", width: "auto", pointerEvents: "none", userSelect: "none" }}
        />
        <span className="brandName" style={{ color: "#fff", fontWeight: 800, letterSpacing: ".2px" }}>
          Founders App
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, marginLeft: "auto", alignItems: "center" }}>
        {!inAdmin && onLogin && (
          <>
            <Link to="/login" className="navLink">User Login</Link>
            <Link to="/admin-login" className="navLink">Admin Login</Link>
          </>
        )}
        {!inAdmin && !onLogin && <Link to="/dashboard" className="navLink">Dashboard</Link>}
        {inAdmin && isAdmin && (
          <>
            <Link to="/admin" className="navLink">Admin Home</Link>
            <Link to="/admin/daily" className="navLink">Daily Submissions</Link>
            <Link to="/admin/tasks" className="navLink">Task Admin</Link>
          </>
        )}
        {me && !onLogin && (
          <button className="navLogoutBtn" onClick={doLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────
   App Routes
   ───────────────────────────────────── */
export default function App() {
  return (
    <>
      <NavBar />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* User area */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin area */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/daily"
          element={
            <AdminRoute>
              <AdminDaily />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <AdminRoute>
              <TaskAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review"
          element={
            <AdminRoute>
              <Review />
            </AdminRoute>
          }
        />
        <Route path="/forgot" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

