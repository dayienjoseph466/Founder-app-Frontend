// client/src/components/ReviewsPanel.jsx
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
  const [comments, setComments] = useState({});      // {logId: text}
  const [loading, setLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState({});  // {logId: objectUrl}

  // load pending items that I am allowed to review
  useEffect(() => {
    let stop = false;

    async function load() {
      try {
        setLoading(true);
        const qs = dateStr ? `?date=${encodeURIComponent(dateStr)}` : "";
        const r = await fetch(`${API_URL}/api/reviews/pending${qs}`, {
          headers: authHeader,
        });
        const rows = r.ok ? await r.json() : [];
        if (!stop) setItems(Array.isArray(rows) ? rows : []);
      } catch {
        if (!stop) setItems([]);
      } finally {
        if (!stop) setLoading(false);
      }
    }
    load();

    // cleanup current previews when list changes on date switch
    return () => {
      stop = true;
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

      // if image show inline preview, else open in new tab
      if (looksLikeImage(it.proofUrl) || blob.type.startsWith("image/")) {
        if (previewSrc[it._id]) URL.revokeObjectURL(previewSrc[it._id]);
        setPreviewSrc((p) => ({ ...p, [it._id]: obj }));
      } else {
        window.open(obj, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(obj), 60000);
      }
    } catch {
      alert("Failed to open proof");
    }
  }

  async function sendDecision(item, decision) {
    try {
      const body = {
        logId: item._id,
        decision,                           // "APPROVE" or "REJECT"
        comment: comments[item._id] || "",  // feedback goes back to the submitter
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

      // after I review it, remove it from my list
      // it will still be pending in the system until the other role approves
      setItems((prev) => prev.filter((x) => x._id !== item._id));

      // free preview url if any
      if (previewSrc[item._id]) {
        URL.revokeObjectURL(previewSrc[item._id]);
        setPreviewSrc((p) => {
          const c = { ...p };
          delete c[item._id];
          return c;
        });
      }

      // let parent refresh score or checklist if needed
      onReviewed && onReviewed();
    } catch {
      alert("Network error while sending review");
    }
  }

  if (loading) return <div>Loading…</div>;
  if (items.length === 0) return <div>No items to review</div>;

  return (
    <div className="stack" style={{ maxHeight: "80vh", overflowY: "auto" }}>
      {items.map((it) => {
        const imgUrl = previewSrc[it._id];
        return (
          <div key={it._id} className="card">
            <div className="row" style={{ alignItems: "center", gap: 8 }}>
              <strong className="listTitle">
                {it.taskId?.title || "Task"}
              </strong>
              <div className="grow" />
              <span className="listSub">
                submitted by {it.userId?.name} ({it.userId?.role})
              </span>
            </div>

            <div className="note neutral" style={{ marginTop: 8 }}>
              {it.note || <em className="muted">No note</em>}
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Feedback to submitter
              </label>
              <textarea
                rows={2}
                placeholder="type your feedback here"
                value={comments[it._id] || ""}
                onChange={(e) =>
                  setComments((prev) => ({ ...prev, [it._id]: e.target.value }))
                }
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div className="row" style={{ gap: 8, marginTop: 8, alignItems: "center" }}>
              <button className="btn ghost" onClick={() => openProof(it)}>
                View proof
              </button>
              {imgUrl ? <span className="muted">Image preview below</span> : null}
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

            <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
              Note
              <br />
              Verified only after both required reviewers approve. If either reviewer rejects, it becomes rejected and the submitter can resubmit.
            </div>
          </div>
        );
      })}
    </div>
  );
}
