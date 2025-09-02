import React, { useEffect, useState } from "react";
import { API_URL } from "../api";

export default function AnnouncementsPanel() {
  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };
  const me = JSON.parse(localStorage.getItem("me") || "null");
  const isPublisher = me?.role === "ADMIN" || me?.role === "CEO";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // composer (visible only for Admin/CEO)
  const [openCompose, setOpenCompose] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: ["ALL"],
    pinned: false,
    expiresAt: "",
  });

  async function load() {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/api/announcements`, { headers: authHeader });
      setRows(r.ok ? await r.json() : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function publish(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ title: "", body: "", audience: ["ALL"], pinned: false, expiresAt: "" });
      setOpenCompose(false);
      load();
    } catch (e) {
      alert(e.message || "failed to publish");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const r = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!r.ok) throw new Error(await r.text());
      setRows((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      alert(e.message || "delete failed");
    }
  }

  return (
    <div className="card">
      <div className="row">
        <h3 className="sectionTitle m0">Announcements</h3>
        <div className="grow" />
        {isPublisher && (
          <button className="btn primary" onClick={() => setOpenCompose((s) => !s)}>
            {openCompose ? "Close" : "New"}
          </button>
        )}
      </div>

      {openCompose && isPublisher && (
        <form className="stack" onSubmit={publish} style={{ marginTop: 12 }}>
          <input
            className="textInput"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            rows={4}
            className="textInput"
            placeholder="Write the announcement…"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            required
          />
          <div className="row" style={{ gap: 8 }}>
            <select
              value={form.audience[0] || "ALL"}
              onChange={(e) => setForm((f) => ({ ...f, audience: [e.target.value] }))}
            >
              <option value="ALL">All roles</option>
              <option value="CEO">CEO only</option>
              <option value="COO">COO only</option>
              <option value="MARKETING">Marketing only</option>
            </select>
            <label className="row" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              />
              <span>Pinned</span>
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              placeholder="Expires"
            />
            <div className="grow" />
            <button className="btn primary" type="submit">Publish</button>
          </div>
        </form>
      )}

      <ul className="list" style={{ marginTop: 10 }}>
        {loading ? (
          <li className="muted">Loading…</li>
        ) : rows.length === 0 ? (
          <li className="muted">No announcements</li>
        ) : (
          rows.map((a) => (
            <li key={a._id} className="listRow">
              <div className="listTitle">
                {a.pinned ? "📌 " : ""}{a.title}
              </div>
              <div className="listSub" style={{ whiteSpace: "pre-wrap" }}>{a.body}</div>
              <div className="grow" />
              {isPublisher && (
                <button className="btn" onClick={() => remove(a._id)}>Delete</button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
