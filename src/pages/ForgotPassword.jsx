// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../api";

export default function ForgotPassword({ kind }) {
  const { pathname } = useLocation();
  const isAdmin = kind ? kind === "admin" : pathname.startsWith("/admin");

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (!email) return setMsg("please enter your email");

    setLoading(true);
    try {
      const url = `${API_URL}${isAdmin ? "/api/admin/auth/forgot" : "/api/auth/forgot"}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let message = "if that email exists we sent a reset link";
      try {
        const data = await r.json();
        if (data?.message) message = data.message;
      } catch {
        const text = await r.text();
        if (text) message = text;
      }
      setMsg(message);
    } catch {
      setMsg("something went wrong. try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgotWrap" style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2 className="forgotTitle">{isAdmin ? "admin forgot password" : "forgot password"}</h2>
      <p className="forgotText">enter your email and we will send a reset link</p>

      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "sending..." : "send link"}
        </button>
      </form>

      {msg ? <p className="forgotText" style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
