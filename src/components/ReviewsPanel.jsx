// client/src/components/ReviewsPanel.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

function normRole(r) {
  return String(r || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " "); // collapse spaces
}
function canReview(myRole, ownerRole) {
  const me = normRole(myRole);
  const owner = normRole(ownerRole);

  // your routing: CEO -> only COO or Marketing Manager
  if (owner === "CEO" || owner === "CHIEF EXECUTIVE OFFICER") {
    return me === "COO" || me === "CHIEF OPERATING OFFICER" || me === "MARKETING MANAGER";
  }
  // everyone else visible to everyone (tune later if needed)
  return true;
}
function getOwnerRole(it) {
  return (
    it?.userId?.role ||
    it?.user?.role ||
    it?.owner?.role ||
    it?.submittedBy?.role ||
    ""
  );
}
function toAbsolute(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

export default function ReviewsPanel({ dateStr, onReviewed }) {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");
  const myRole = me?.role;

  const [items, setItems] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (dateStr) qs.set("date", dateStr);

        // try common inbox endpoints; fall back to logs pending
        const endpoints = [
          `${API_URL}/api/reviews/pending?${qs}`,
          `${API_URL}/api/review/inbox?${qs}`,
          `${API_URL}/api/logs/reviewable?${qs}`,
          `${API_URL}/api/logs?status=PENDING&${qs}`,
        ];

        let rows = [];
        for (const url of endpoints) {
          try {
            const r = await fetch(url, { headers: authHeader });
            if (r.ok) {
              const data = await r.json();
              rows = Array.isArray(data) ? data : data.items || data.rows || [];
              if (rows.length || url.includes("/reviews/")) break;
            }
          } catch {}
        }

        // never show items submitted by myself
        const mineId = me?._id || me?.id;
        const notMine = rows.filter(
          (x) =>
            (x.userId?._id || x.userId || x.user?._id || x.owner?._id) !== mineId
        );

        // apply routing rule
        const filtered = notMine.filter((it) => canReview(myRole, getOwnerRole(it)));
        setItems(filtered);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, myRole]);

  async function openProofWithAuth(url) {
    try {
      const abs = toAbsolute(url);
      const r = await fetch(abs, { headers: authHeader });
      if (!r.ok) throw new Error("Could not load proof");
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);
      window.open(obj, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(obj), 60000);
    } catch {
      alert("Failed to open proof");
    }
  }

  async function sendDecision(item, decision) {
    try {
      const body = {
        logId: item._id,
        decision, // "APPROVE" or "REJECT"
        comment: comments[item._id] || "",
        reviewerRole: myRole,
      };
      const r = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        alert(t || "Failed to submit review");
        return;
      }
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      setComments((prev) => {
        const c = { ...prev };
        delete c[item._id];
        return c;
      });
      onReviewed && onReviewed();
    } catch {
      alert("Network error while submitting review");
    }
  }

  return (
    <>
      <h3>Reviews</h3>
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div>No items to review</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => (
            <div
              key={it._id}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 15 }}>
                  {it.taskId?.title || it.title || "Task"}
                </strong>
                <span style={{ color: "#666", fontSize: 12 }}>
                  from {it.userId?.name || it.user?.name || it.owner?.name}{" "}
                  ({getOwnerRole(it)})
                </span>
                <div style={{ marginLeft: "auto" }}>
                  {it.proofUrl ? (
                    <button onClick={() => openProofWithAuth(it.proofUrl)}>
                      View proof
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  background: "#fafafa",
                  border: "1px dashed #ddd",
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 13,
                }}
              >
                {it.note || <em style={{ color: "#666" }}>No note</em>}
              </div>

              <textarea
                rows={2}
                placeholder="feedback"
                value={comments[it._id] || ""}
                onChange={(e) =>
                  setComments((p) => ({ ...p, [it._id]: e.target.value }))
                }
                style={{ width: "100%", marginTop: 8, resize: "vertical" }}
              />

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button onClick={() => sendDecision(it, "APPROVE")}>Approve</button>
                <button onClick={() => sendDecision(it, "REJECT")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
