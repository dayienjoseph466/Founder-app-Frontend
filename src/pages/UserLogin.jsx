// client/src/pages/UserLogin.jsx
import React, { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "./UserLogin.css";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "login failed");
      }
      const data = await r.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify(data.user));
      nav("/dashboard", { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="loginShell">
      <div className="loginFrame">
        {/* Left hero */}
        <section className="leftHero" aria-hidden>
          <h1 className="leftTitle">Welcome back</h1>
          <p className="leftSub">Please enter your details</p>

          {/* Friendly SVG illustration */}
          <svg
            className="heroArt"
            viewBox="0 0 520 320"
            width="520"
            height="320"
          >
            <defs>
              <linearGradient id="b" x1="0" x2="1">
                <stop offset="0" stopColor="#93c8ff" />
                <stop offset="1" stopColor="#d6ecff" />
              </linearGradient>
            </defs>
            <circle cx="460" cy="108" r="40" fill="url(#b)" opacity=".35" />
            <circle cx="120" cy="110" r="26" fill="url(#b)" opacity=".35" />
            <rect x="140" y="120" width="240" height="150" rx="24" fill="#ffffff" opacity=".22" />
            <g transform="translate(120,140)">
              <path d="M0 112c0-56 44-94 98-94s98 38 98 94" fill="#eaf3ff" />
              <circle cx="122" cy="40" r="42" fill="#1f3b6b" />
              <circle cx="142" cy="52" r="34" fill="#ffe9d6" />
              <rect x="60" y="98" width="164" height="20" rx="10" fill="#1f3b6b" />
              <rect x="72" y="74" width="140" height="40" rx="20" fill="#ffffff" />
              <g transform="translate(210,28) rotate(12)">
                <rect x="0" y="0" width="18" height="54" rx="9" fill="#ffe9d6" />
                <rect x="4" y="-6" width="14" height="18" rx="7" fill="#ffe9d6" />
                <rect x="4" y="-18" width="14" height="18" rx="7" fill="#ffe9d6" />
              </g>
            </g>
          </svg>
        </section>

        {/* Right login card */}
        <section className="loginCard2" aria-label="Login form">
          <div className="topRow">
            <span className="crumb">User Login</span>
            <span className="brandChip">
              <img src="/logo.png" alt="" />
              Founders App
            </span>
          </div>

          <h2 className="title">Welcome back</h2>
          <p className="subtitle">Please enter your details</p>

          <form onSubmit={submit} className="loginForm2">
            <label className="inputWrap">
              <span className="leading" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="3" stroke="#2563eb" strokeWidth="1.7" />
                  <path d="M3 7l9 6 9-6" stroke="#2563eb" strokeWidth="1.7" />
                </svg>
              </span>
              <input
                className="textInput"
                type="email"
                placeholder="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <span />
            </label>

            <label className="inputWrap">
              <span className="leading" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="9" rx="2" stroke="#2563eb" strokeWidth="1.7" />
                  <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="#2563eb" strokeWidth="1.7" />
                </svg>
              </span>
              <input
                className="textInput"
                type={show ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="trailing"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="#6b7280" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="3" stroke="#6b7280" strokeWidth="1.6" />
                </svg>
              </button>
            </label>

            <div className="row">
              <label className="remember">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="btnPrimary">Log in</button>

            <div className="footerLinks">
              <a
                href="/forgot"
                onClick={(e) => {
                  e.preventDefault();
                  nav("/forgot");
                }}
                className="link"
              >
                Forgot password?
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="link">
                Create account
              </a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
