// client/src/components/ReviewsPanel.jsx
import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

function toAbsoluteProof(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;            // already absolute
  if (url.startsWith(API_URL)) return url;               // already prefixed
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ReviewsPanel({ dateStr, onReviewed }) {
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [comments, setComments] = useState({}); // {logId: text}
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const qs = new URLSearchParams();
        if (dateStr) qs.set("date", dateStr);

        const r = await fetch(`${API_URL}/api/reviews/pending?${qs}`, {
          headers: authHeader,
        });
        const rows = r.ok ? await r.json() : [];
        setItems(rows || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  async function sendDecision(item, decision) {
    try {
      const body = {
        logId: item._id,
        decision, // "APPROVE" or "REJECT"
        comment: comments[item._id] || "",
      };

      const r = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const txt = await r.text();
        alert(txt || "Failed to submit review");
        return;
      }

      // remove reviewed item locally
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      setComments((prev) => {
        const copy = { ...prev };
        delete copy[item._id];
        return copy;
      });

      // let parent refresh scores/logs if they provided a callback
      onReviewed && onReviewed();
    } catch (e) {
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
          {items.map((it) => {
            const proofHref = toAbsoluteProof(it.proofUrl);
            return (
              <div
                key={it._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <strong style={{ fontSize: 15, marginRight: 8 }}>
                    {it.taskId?.title || "Task"}
                  </strong>
                  <span style={{ color: "#666", fontSize: 12 }}>
                    from {it.userId?.name} ({it.userId?.role})
                  </span>
                  <div style={{ marginLeft: "auto" }}>
                    {proofHref && (
                      <a
                        href={proofHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View proof
                      </a>
                    )}
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
                    setComments((prev) => ({
                      ...prev,
                      [it._id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    marginTop: 8,
                    resize: "vertical",
                  }}
                />

                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button onClick={() => sendDecision(it, "APPROVE")}>
                    Approve
                  </button>
                  <button onClick={() => sendDecision(it, "REJECT")}>
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
