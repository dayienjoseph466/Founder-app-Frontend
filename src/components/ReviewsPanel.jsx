import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

function toAbsolute(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function looksLikeImage(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url || "");
}

export default function ReviewsPanel({ dateStr, onReviewed }) {
  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  const [items, setItems] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState({}); // {logId: objectUrl}

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // show todays items when date is given. if you want everything, drop the query
        const qs = dateStr ? `?date=${encodeURIComponent(dateStr)}` : "";
        const r = await fetch(`${API_URL}/api/reviews/pending${qs}`, {
          headers: authHeader,
        });
        const rows = r.ok ? await r.json() : [];
        setItems(Array.isArray(rows) ? rows : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    // revoke old previews when date changes
    return () => {
      Object.values(previewSrc).forEach((u) => URL.revokeObjectURL(u));
      setPreviewSrc({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  async function openProof(it) {
    try {
      const href = toAbsolute(it.proofUrl);
      if (!href) return alert("No proof attached");

      // fetch with auth so protected files work
      const r = await fetch(href, { headers: authHeader });
      if (!r.ok) throw new Error("Could not load proof");
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);

      // if it is an image, show inline preview. otherwise open a new tab
      if (looksLikeImage(it.proofUrl) || blob.type.startsWith("image/")) {
        // clean old url for this item
        if (previewSrc[it._id]) URL.revokeObjectURL(previewSrc[it._id]);
        setPreviewSrc((p) => ({ ...p, [it._id]: obj }));
      } else {
        window.open(obj, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(obj), 60000);
      }
    } catch (e) {
      alert("Failed to open proof");
    }
  }

  async function sendDecision(item, decision) {
    try {
      const body = {
        logId: item._id,
        decision, // APPROVE or REJECT
        comment: comments[item._id] || "",
      };
      const r = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        alert(t || "Review failed");
        return;
      }
      // remove from list and clear preview
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      if (previewSrc[item._id]) {
        URL.revokeObjectURL(previewSrc[item._id]);
        setPreviewSrc((p) => {
          const c = { ...p };
          delete c[item._id];
          return c;
        });
      }
      onReviewed && onReviewed();
    } catch {
      alert("Network error while sending review");
    }
  }

  if (loading) return <div>Loading…</div>;
  if (items.length === 0) return <div>No items to review</div>;

  return (
    <div className="stack">
      {items.map((it) => {
        const imgUrl = previewSrc[it._id];
        return (
          <div key={it._id} className="card">
            <div className="row" style={{ alignItems: "center" }}>
              <strong className="listTitle">{it.taskId?.title || "Task"}</strong>
              <div className="grow" />
              <span className="listSub">
                from {it.userId?.name} ({it.userId?.role})
              </span>
            </div>

            <div className="note neutral" style={{ marginTop: 8 }}>
              {it.note || <em className="muted">No note</em>}
            </div>

            <div className="row" style={{ gap: 8, marginTop: 8, alignItems: "center" }}>
              <button className="btn ghost" onClick={() => openProof(it)}>
                View proof
              </button>
              {imgUrl ? (
                <span className="muted">Image preview shown below</span>
              ) : null}
              <div className="grow" />
              <button className="btn primary" onClick={() => sendDecision(it, "APPROVE")}>
                Approve
              </button>
              <button className="btn" onClick={() => sendDecision(it, "REJECT")}>
                Reject
              </button>
            </div>

            {imgUrl ? (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imgUrl}
                  alt="proof"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    display: "block",
                  }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
