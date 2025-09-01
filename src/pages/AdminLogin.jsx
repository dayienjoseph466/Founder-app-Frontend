// client/src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { API_URL } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      // use the admin endpoint
      const r = await fetch(`${API_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "Login failed");
      }

      const data = await r.json(); // { token, admin: { id, name, email } }
      localStorage.setItem("token", data.token);
      // store role so the navbar and guards work
      localStorage.setItem(
        "me",
        JSON.stringify({ ...data.admin, role: "ADMIN" })
      );

      nav("/admin", { replace: true });
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="adminHero">
        <div className="adminHero__inner">
          <h1 className="adminHero__title">Hello <span role="img" aria-label="wave">👋</span> Welcome!</h1>
          <p className="adminHero__sub">Please login to admin dashboard</p>
        </div>
      </section>

      <main className="adminMain">
        <div className="adminCard">
          <h2 className="adminCard__title">LogIn</h2>
          <p className="adminCard__hint">Please login to admin dashboard</p>

          <form className="adminForm" onSubmit={submit}>
            <div className="field">
              <span className="iconLeft" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                </svg>
              </span>
              <input
                className="input"
                type="email"
                placeholder="Email/Username*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <span className="iconLeft" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </span>
              <input
                className="input"
                type={show ? "text" : "password"}
                placeholder="Password*"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="iconRight"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>

            <div className="rowBetween">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <Link className="link" to="/admin/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button className="adminBtn" type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
