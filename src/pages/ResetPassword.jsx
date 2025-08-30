import React, { useState, useMemo } from "react";
import { API_URL } from "../api";

export default function ResetPassword() {
  const token = useMemo(() => new URLSearchParams(location.search).get("token"), []);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!token) return setMsg("Bad link");
    if (p1 !== p2) return setMsg("Passwords do not match");
    setMsg("");
    const r = await fetch(`${API_URL}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: p1 }),
    });
    const t = await r.text();
    setMsg(t || "Password updated");
    if (r.ok) setTimeout(() => (window.location.href = "/login"), 800);
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Set a new password</h2>
      <input
        type="password"
        placeholder="New password"
        value={p1}
        onChange={(e) => setP1(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={p2}
        onChange={(e) => setP2(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />
      <button onClick={submit} style={{ marginTop: 12 }}>Save password</button>
      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
