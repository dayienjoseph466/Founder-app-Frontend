import React, { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="loginSplit">
      {/* Left: image panel (non-interactive) */}
      <aside className="loginImg" aria-hidden="true" />

      {/* Right: login card */}
      <section className="loginPanel">
        <div className="loginCard">
          <img src="/logo.png" alt="" className="miniLogo" />
          <h1 className="loginTitle">Welcome</h1>
          <p className="loginSub">Log in to continue</p>

          <form onSubmit={submit} className="loginForm">
            <label className="inputWrap">
              <span className="i leading">✉️</span>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="inputWrap">
              <span className="i leading">🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <div className="formRow">
              <a
                className="link"
                href="/forgot"
                onClick={(e) => {
                  e.preventDefault();
                  nav("/forgot");
                }}
              >
                Forgot Your Password?
              </a>
            </div>

            <button type="submit" className="btnPrimary btnBlock">
              Continue
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
