import React, { useMemo, useState } from "react";
import { API_URL } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const pwdLooksGood = useMemo(() => password.trim().length >= 6, [password]);

  const nav = useNavigate();

  function validateEmailLike(v) {
    const s = String(v || "").trim();
    if (!s) return "Email or username is required";
    const emailish = /\S+@\S+\.\S+/.test(s);
    const usernameish = s.length >= 3;
    return emailish || usernameish ? "" : "Invalid email or username";
  }

  async function submit(e) {
    e.preventDefault();
    const err = validateEmailLike(email);
    setEmailError(err);
    if (err || !password) return;

    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        setEmailError(/invalid/i.test(t) ? "Invalid email or username" : (t || "Login failed"));
        return;
      }

      const data = await r.json(); // { token, admin: { id, name, email } }
      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify({ ...data.admin, role: "ADMIN" }));
      if (!remember) {
        // (optional) no-op: you could clear token on unload if you want
      }
      nav("/admin", { replace: true });
    } catch (err2) {
      setEmailError(err2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="alPage">
      <header className="alTop">
        <div className="alBrand">
          <img src="/logo.png" alt="" className="alLogo" />
          <span>Founders App</span>
        </div>
        <nav className="alTopLinks">
          <a href="/" className="alTopLink">Back to site</a>
          <a href="mailto:support@yourdomain.com" className="alTopLink">Help</a>
        </nav>
      </header>

      <main className="alCenter">
        <div className="alCard" role="group" aria-label="Admin login">
          <h1 className="alTitle">Admin Login</h1>
          <p className="alSubtitle">Please enter your credentials.</p>

          <form className="alForm" onSubmit={submit} noValidate>
            <label className="alLabel" htmlFor="admin-email">Email or username</label>
            <div className={`alField ${emailError ? "hasError" : ""}`}>
              <input
                id="admin-email"
                className="alInput"
                type="text"
                placeholder="you@company.com"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmailLike(e.target.value));
                }}
                required
              />
            </div>
            {emailError ? (
              <div className="alBadge error">
                <span className="ico">✖</span> {emailError}
              </div>
            ) : null}

            <label className="alLabel" htmlFor="admin-pass">Password</label>
            <div className="alField">
              <input
                id="admin-pass"
                className="alInput"
                type={show ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="alEye"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
              >
                {show ? "🙈" : "👁️"}
              </button>
            </div>
            {password ? (
              <div className={`alBadge ${pwdLooksGood ? "ok" : "note"}`}>
                <span className="ico">{pwdLooksGood ? "✔" : "ℹ"}</span>
                {pwdLooksGood ? "Looks good!" : "Use at least 6 characters"}
              </div>
            ) : null}

            <div className="alRow">
              <label className="alRemember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <Link className="alLink" to="/admin/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button className="alBtn primary" type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>

            <div className="alOr">
              <span className="line" />
              <span className="txt">Or</span>
              <span className="line" />
            </div>

            {/* Social placeholders (non-functional) */}
            <div className="alSocial">
              <button type="button" className="alBtn ghost" disabled title="Not enabled">
                <span className="sIco">🟢</span> Continue with Google
              </button>
              <button type="button" className="alBtn ghost" disabled title="Not enabled">
                <span className="sIco">🟦</span> Continue with Microsoft
              </button>
            </div>

            <p className="alLegal">
              By logging in, you agree to the <a href="#" className="alLink">Terms</a> and{" "}
              <a href="#" className="alLink">Privacy</a>.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
