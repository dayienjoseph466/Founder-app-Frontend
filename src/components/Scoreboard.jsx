import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

export default function Scoreboard() {
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/scoreboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(setRows)
      .catch(() => setRows([]));
  }, [token]);

  if (!rows.length) return <p>No totals yet</p>;

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Team scoreboard — lifetime</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Rank</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Role</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Tasks approved</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.userId || i}>
              <td style={{ padding: 8 }}>{i + 1}</td>
              <td style={{ padding: 8 }}>{r.name}</td>
              <td style={{ padding: 8 }}>{r.role}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{r.tasksApproved ?? 0}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{r.total ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
