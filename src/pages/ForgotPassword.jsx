import React, { useState } from "react";
import { API_URL } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    const r = await fetch(`${API_URL}/api/auth/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const t = await r.text();
    setMsg(t || "Check your email for the reset link");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Forgot password</h2>
      <p>Enter your email and we will send a reset link</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />
      <button onClick={submit} style={{ marginTop: 12 }}>Send link</button>
      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
