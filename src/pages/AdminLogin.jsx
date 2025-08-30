import React, { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";

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
      // If your admin endpoint is different, keep your original URL here
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "Login failed");
      }

      const data = await r.json(); // {token, user}
      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify(data.user));
      if (!remember) {
        // optional: store a small marker so you could clear on unload
      }
      nav("/admin", { replace: true });
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="adminHero">
        <div className="adminHero__inner">
          <h1 className="adminHero__title">Hello <span role="img" aria-label="wave"></span> Welcome!</h1>
          <p className="adminHero__sub">Please login to admin dashboard</p>
        </div>
      </section>

      {/* Main area (separate from hero – no overlap) */}
      <main className="adminMain">
        <div className="adminCard">
          <h2 className="adminCard__title">LogIn</h2>
          <p className="adminCard__hint">Please login to admin dashboard</p>

          <form className="adminForm" onSubmit={submit}>
            {/* Email */}
            <div className="field">
              <span className="iconLeft" aria-hidden>
                {/* mail icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" rx="3" ry="3"/>
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

            {/* Password */}
            <div className="field">
              <span className="iconLeft" aria-hidden>
                {/* lock icon */}
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
                {/* eye icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>

            {/* remember + forgot */}
            <div className="rowBetween">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a className="link" href="#" onClick={(e)=>e.preventDefault()}>
                Forgot password?
              </a>
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
