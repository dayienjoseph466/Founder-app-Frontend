// src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../api";

export default function ResetPassword({ kind }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = kind ? kind === "admin" : location.pathname.startsWith("/admin");

  const token = useMemo(
    () => new URLSearchParams(location.search).get("token"),
    [location.search]
  );

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!token) return setMsg("bad link");
    if (p1.length < 6) return setMsg("password must be at least 6 characters");
    if (p1 !== p2) return setMsg("passwords do not match");

    setMsg("");
    setLoading(true);
    try {
      const url = `${API_URL}${isAdmin ? "/api/admin/auth/reset" : "/api/auth/reset"}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: p1 }),
      });

      let text = "password updated";
      try {
        const data = await r.json();
        if (data?.message) text = data.message;
      } catch {
        const t = await r.text();
        if (t) text = t;
      }

      setMsg(text);
      if (r.ok) {
        setTimeout(() => {
          navigate(isAdmin ? "/admin-login" : "/login");
        }, 800);
      }
    } catch {
      setMsg("something went wrong please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>{isAdmin ? "admin reset password" : "set a new password"}</h2>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="new password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <input
          type="password"
          placeholder="confirm password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "saving..." : "save password"}
        </button>
      </form>
      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
