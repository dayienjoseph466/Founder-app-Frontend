// client/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";
import ReviewsPanel from "../components/ReviewsPanel";
import "../App.css";

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lookForStatus(status) {
  switch (status) {
    case "VERIFIED":
    case "APPROVED":
      return { key: "approved", label: "Approved" };
    case "REJECTED":
      return { key: "rejected", label: "Rejected" };
    case "PENDING":
      return { key: "pending", label: "Pending" };
    default:
      return { key: "neutral", label: "" };
  }
}

const REVIEW_RULES = {
  CEO: ["COO", "MARKETING"],
  COO: ["CEO", "MARKETING"],
  MARKETING: ["CEO", "COO"],
};
const canReview = (myRole, ownerRole) => {
  const me = String(myRole || "").toUpperCase();
  const owner = String(ownerRole || "").toUpperCase();
  const needed = REVIEW_RULES[owner] || ["COO", "MARKETING"];
  return needed.includes(me);
};

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");
  const authHeader = { Authorization: `Bearer ${token}` };

  const [dateStr, setDateStr] = useState(toYMD(new Date()));
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState({
    total: 0,
    rawPoints: 0,
    proofBonus: 0,
    verifyBonus: 0,
  });

  const [reviewInbox, setReviewInbox] = useState([]); // items you should review
  const [lifetime, setLifetime] = useState([]); // team scoreboard

  const [drafts, setDrafts] = useState({});
  const [savingTaskId, setSavingTaskId] = useState(null);

  function setDraft(taskId, patch) {
    setDrafts((prev) => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), ...patch } }));
  }

  // tasks one time
  useEffect(() => {
    fetch(`${API_URL}/api/tasks`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTasks)
      .catch(() => setTasks([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // logs and today score by date
  useEffect(() => {
    const qs = new URLSearchParams({ date: dateStr });

    fetch(`${API_URL}/api/logs?${qs}`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        setLogs(rows);
        const next = {};
        rows.forEach((l) => {
          next[l.taskId?._id || l.taskId] = { note: l.note, editing: false };
        });
        setDrafts((d) => ({ ...d, ...next }));
      });

    fetch(`${API_URL}/api/score?${qs}`, { headers: authHeader })
      .then((r) =>
        r.ok ? r.json() : { total: 0, rawPoints: 0, proofBonus: 0, verifyBonus: 0 }
      )
      .then(setScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  // inbox + lifetime
  useEffect(() => {
    loadInbox();
    loadLifetime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.role]);

  async function loadInbox() {
    try {
      // server route that actually exists
      const r = await fetch(`${API_URL}/api/reviews/pending?date=${encodeURIComponent(dateStr)}`, {
        headers: authHeader,
      });
      const raw = r.ok ? await r.json() : [];
      const arr = Array.isArray(raw) ? raw : [];
      // server returns submitter under userId
      const filtered = arr.filter((it) => canReview(me?.role, it?.userId?.role));
      setReviewInbox(filtered);
    } catch {
      setReviewInbox([]);
    }
  }

  async function loadLifetime() {
    try {
      const r = await fetch(`${API_URL}/api/scoreboard`, { headers: authHeader });
      let data = r.ok ? await r.json() : [];
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => b.total - a.total);
      setLifetime(data);
    } catch {
      setLifetime([]);
    }
  }

  const logByTask = useMemo(() => {
    const m = new Map();
    logs.forEach((l) => m.set(l.taskId?._id || l.taskId, l));
    return m;
  }, [logs]);

  const completedCount = logs.length;

  async function submitLog(task) {
    const d = drafts[task._id] || {};
    if (!d.note || !d.file) {
      alert("Please add note and file before submitting.");
      return;
    }
    setSavingTaskId(task._id);
    try {
      const fd = new FormData();
      fd.append("taskId", task._id);
      fd.append("date", dateStr);
      fd.append("note", d.note);
      fd.append("proof", d.file);

      const r = await fetch(`${API_URL}/api/logs/upsert`, {
        method: "POST",
        headers: authHeader,
        body: fd,
      });
      if (!r.ok) throw new Error(await r.text());
      const saved = await r.json();

      setLogs((prev) => {
        const idx = prev.findIndex(
          (x) => (x.taskId?._id || x.taskId) === task._id && x.date === dateStr
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });

      setDraft(task._id, { editing: false });
    } catch {
      alert("Save failed");
    } finally {
      setSavingTaskId(null);
    }
  }

  function startResubmit(taskId) {
    setDraft(taskId, { editing: true, file: null });
  }

  function toAbsolute(u) {
    if (!u) return null;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`;
  }

  async function openProof(u) {
    try {
      const url = toAbsolute(u);
      const r = await fetch(url, { headers: authHeader });
      if (!r.ok) throw new Error("Could not load proof");
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);
      window.open(obj, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(obj), 60000);
    } catch {
      alert("Failed to open proof");
    }
  }

  return (
    <div className="dash">
      <header className="dashHeader">
        <h1 className="dashTitle">Daily Dashboard</h1>
        <p className="dashSub">
          {me?.name ? `Hello ${me.name}. ` : ""}{me?.role ? `Role ${me.role}` : ""}
        </p>
      </header>

      <div className="quickBar">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          max={toYMD(new Date())}
        />
        <div className="summaryPill">
          {completedCount} of {tasks.length} tasks completed. Remaining{" "}
          {Math.max(0, tasks.length - completedCount)}.
        </div>
      </div>

      <main className="grid">
        {/* left column */}
        <section>
          <h3 className="sectionTitle">Today’s Checklist</h3>

          {tasks.length === 0 ? (
            <p className="muted">No tasks yet</p>
          ) : (
            <div className="stack">
              {tasks.map((task) => {
                const log = logByTask.get(task._id);
                const done = Boolean(log);
                const editing = drafts[task._id]?.editing || !done;
                const locked = done && !editing;
                const theme = lookForStatus(log?.status);

                const summary = log?.reviewSummary;
                const approvals = log?.approvedCount ?? summary?.approvals ?? 0;
                const rejections = log?.rejectedCount ?? summary?.rejections ?? 0;
                const required = summary?.required ?? 2;

                return (
                  <div key={task._id} className={`card taskCard ${done ? theme.key : "neutral"}`}>
                    <div className="row headRow">
                      <div className={`statusDot ${theme.key}`} />
                      <strong className="taskTitle">{task.title}</strong>
                      <span className="pts">({task.points} pts)</span>

                      {done && theme.label && (
                        <span className={`chip ${theme.key}`}>{theme.label}</span>
                      )}

                      <div className="grow" />
                      {done && !editing && (
                        <button className="btn ghost" onClick={() => startResubmit(task._id)}>
                          Resubmit
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={3}
                      className={`note ${done ? theme.key : "neutral"}`}
                      placeholder="Write your note here"
                      value={drafts[task._id]?.note || ""}
                      onChange={(e) => setDraft(task._id, { note: e.target.value })}
                      disabled={locked}
                    />

                    <div className={`uploadBar ${done ? theme.key : "neutral"}`}>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={locked}
                        onChange={(e) =>
                          setDraft(task._id, { file: e.target.files?.[0] || null })
                        }
                      />
                      <button
                        className="btn primary"
                        onClick={() => submitLog(task)}
                        disabled={locked || savingTaskId === task._id}
                      >
                        {done ? "Save Resubmission" : "Submit"}
                      </button>

                      {log?.proofUrl && (
                        <a
                          href={log.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openProof(log.proofUrl);
                          }}
                          className="link"
                        >
                          View proof
                        </a>
                      )}
                    </div>

                    {done && (
                      <div className={`progress ${theme.key}`}>
                        <strong>Review progress:</strong>{" "}
                        {approvals}/{required} approved
                        {rejections > 0 ? (
                          <span className="rejectedText"> — {rejections} rejected</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* full review panel for COO and Marketing etc */}
          <div className="card" style={{ marginTop: 16 }}>
            <ReviewsPanel
              dateStr={dateStr}
              onReviewed={() => {
                // refresh the small count on the right after any action
                loadInbox();
                // also refresh logs so the status chips update
                const qs = new URLSearchParams({ date: dateStr });
                fetch(`${API_URL}/api/logs?${qs}`, { headers: authHeader })
                  .then((r) => (r.ok ? r.json() : []))
                  .then(setLogs);
              }}
            />
          </div>
        </section>

        {/* right column */}
        <aside className="stack">
          <div className="card">
            <div className="row">
              <h3 className="sectionTitle m0">Tasks for review</h3>
              <div className="count">{reviewInbox.length}</div>
            </div>
            <ul className="list">
              {reviewInbox.length === 0 ? (
                <li className="muted">No items</li>
              ) : (
                reviewInbox.slice(0, 8).map((it, i) => (
                  <li key={it._id || i} className="listRow">
                    <div className="listTitle">{it.taskId?.title || "Task"}</div>
                    <div className="listSub">
                      by {it.userId?.name || "User"} ({it.userId?.role || "role unknown"})
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="card">
            <h3 className="sectionTitle">Lifetime total score</h3>
            {lifetime.length === 0 ? (
              <div className="muted">No data yet</div>
            ) : (
              <ol className="board">
                {lifetime.slice(0, 12).map((row, idx) => (
                  <li
                    key={String(row.userId || row.name) + idx}
                    className={`boardRow ${idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : ""}`}
                  >
                    <div className="rank">{idx + 1}</div>
                    <div className="who">
                      <div className="nm">{row.name}</div>
                      <div className="rl">{row.role}</div>
                    </div>
                    <div className="ttl">{row.total}</div>
                    {idx < 3 ? <div className="badge">{idx + 1}</div> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card">
            <h3 className="sectionTitle">Your score today</h3>
            <div className="todayScore">
              <div><strong>Total</strong> {score.total}</div>
              <div><strong>Raw</strong> {score.rawPoints}</div>
              <div><strong>Proof bonus</strong> {score.proofBonus}</div>
              <div><strong>Verify bonus</strong> {score.verifyBonus}</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
