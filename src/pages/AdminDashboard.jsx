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
    try {
      setLoading(true);
      // use ADMIN endpoint
      const r = await fetch(`${API_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "Login failed");
      }
      const data = await r.json(); // { token, admin }
      localStorage.setItem("token", data.token);
      // ensure role is ADMIN for guards/nav
      localStorage.setItem("me", JSON.stringify({ ...data.admin, role: "ADMIN" }));
      nav("/admin", { replace: true });
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* HERO */}
      <section className="adminHero pro">
        <div className="adminHero__inner">
          <h1 className="adminHero__title">
            Hello <span role="img" aria-label="wave">👋</span> Welcome!
          </h1>
          <p className="adminHero__sub">Please login to admin dashboard</p>
        </div>
      </section>

      {/* MAIN */}
      <main className="adminMain pro">
        <div className="adminCard pro" role="group" aria-label="Admin login">
          <header className="adminCard__head">
            <div className="dot" aria-hidden />
            <div>
              <h2 className="adminCard__title">LogIn</h2>
              <p className="adminCard__hint">Please login to admin dashboard</p>
            </div>
          </header>

          <form className="adminForm" onSubmit={submit}>
            {/* EMAIL */}
            <div className="field field--float">
              <span className="iconLeft" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                </svg>
              </span>
              <input
                id="admin-email"
                className="input input--float"
                type="email"
                placeholder=" "
                autoComplete="username"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
              <label htmlFor="admin-email">Email / Username</label>
            </div>

            {/* PASSWORD */}
            <div className="field field--float">
              <span className="iconLeft" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </span>
              <input
                id="admin-pass"
                className="input input--float"
                type={show ? "text" : "password"}
                placeholder=" "
                autoComplete="current-password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                required
              />
              <label htmlFor="admin-pass">Password</label>
              <button
                type="button"
                className="iconRight"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={()=>setShow(s=>!s)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </button>
            </div>

            {/* OPTIONS */}
            <div className="rowBetween">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <Link className="link" to="/admin/forgot-password">Forgot password?</Link>
            </div>

            {/* SUBMIT */}
            <button className="adminBtn pro" type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
