// client/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../api";
import ReviewsPanel from "../components/ReviewsPanel";
import Scoreboard from "../components/Scoreboard"; // <-- ADDED

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* status theme for the whole card + inner panels */
function lookForStatus(status) {
  switch (status) {
    case "VERIFIED":
      return {
        bg: "#eafaf1",          // whole card
        panelBg: "#f0fdf4",     // inner blocks (textarea/progress)
        border: "#10b981",
        chipBg: "#dcfce7",
        chipText: "#065f46",
        label: "Approved",
      };
    case "REJECTED":
      return {
        bg: "#fff1f1",
        panelBg: "#fff6f6",
        border: "#ef4444",
        chipBg: "#fee2e2",
        chipText: "#991b1b",
        label: "Rejected",
      };
    case "PENDING":
      return {
        bg: "#fff9db",
        panelBg: "#fffbe8",
        border: "#f59e0b",
        chipBg: "#fef3c7",
        chipText: "#92400e",
        label: "Pending",
      };
    default:
      return {
        bg: "white",
        panelBg: "transparent",
        border: "#e5e7eb",
        chipBg: "#f3f4f6",
        chipText: "#374151",
        label: "",
      };
  }
}

// color for a single reviewer decision
function decisionColor(decision) {
  if (decision === "APPROVE") return "#0a6";
  if (decision === "REJECT") return "#b00020";
  return "#666";
}

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("me") || "null");

  const [dateStr, setDateStr] = useState(toYMD(new Date()));
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState({
    total: 0,
    rawPoints: 0,
    proofBonus: 0,
    verifyBonus: 0,
  });

  // local form state per taskId
  const [drafts, setDrafts] = useState({}); // {taskId: {note, file, editing}}
  const [savingTaskId, setSavingTaskId] = useState(null);
  const authHeader = { Authorization: `Bearer ${token}` };

  function setDraft(taskId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), ...patch },
    }));
  }

  // load tasks once
  useEffect(() => {
    fetch(`${API_URL}/api/tasks`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTasks)
      .catch(() => setTasks([]));
    // eslint-disable-next-line
  }, []);

  // load logs (with full reviews/summary) & score on date change
  useEffect(() => {
    const qs = new URLSearchParams({ date: dateStr });

    fetch(`${API_URL}/api/logs?${qs}`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        setLogs(rows);
        // prefill note drafts
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
    // eslint-disable-next-line
  }, [dateStr]);

  // map taskId -> log
  const logByTask = useMemo(() => {
    const m = new Map();
    logs.forEach((l) => m.set(l.taskId?._id || l.taskId, l));
    return m;
  }, [logs]);

  const completedCount = logs.length;

  // submit new or resubmission
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

      // update local list
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

  // --- ADDED: open proof with auth and show in new tab
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
    } catch (e) {
      alert("Failed to open proof");
    }
  }
  // --- END ADDED

  return (
    <div style={{ padding: 16, maxWidth: 940 }}>
      <h2>Daily Dashboard</h2>
      <p>
        Hello {me?.name}. Role {me?.role}
      </p>

      <label>Date </label>
      <input
        type="date"
        value={dateStr}
        onChange={(e) => setDateStr(e.target.value)}
        max={toYMD(new Date())}
      />

      <div
        style={{
          margin: "12px 0",
          padding: "8px 12px",
          background: "#f4f4f4",
          borderRadius: 6,
        }}
      >
        <strong>
          {completedCount} of {tasks.length} tasks completed. Remaining{" "}
          {tasks.length - completedCount}.
        </strong>
      </div>

      <h3>Your checklist</h3>

      {tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {tasks.map((task) => {
            const log = logByTask.get(task._id);
            const done = Boolean(log); // submitted at least once
            const editing = drafts[task._id]?.editing || !done;
            const locked = done && !editing;

            const { bg, panelBg, border, chipBg, chipText, label } =
              lookForStatus(log?.status);

            // server may send either `reviewSummary` OR counts on the log
            const summary = log?.reviewSummary;
            const approvals = log?.approvedCount ?? summary?.approvals ?? 0;
            const rejections = log?.rejectedCount ?? summary?.rejections ?? 0;
            const required = summary?.required ?? 2;

            const reviews = (log?.reviews || []).map((r) => ({
              name: r.name ?? r.reviewer?.name ?? "Unknown",
              role: r.role ?? r.reviewer?.role ?? "?",
              decision: r.decision,
              comment: r.comment || "",
              key:
                (r.name || r.reviewer?.name || "x") +
                "-" +
                (r.role || r.reviewer?.role || "?") +
                "-" +
                (r.comment || "") +
                "-" +
                Math.random().toString(36).slice(2),
            }));

            return (
              <div
                key={task._id}
                style={{
                  border: `1px solid ${done ? border : "#e5e7eb"}`,
                  borderRadius: 12,
                  padding: 12,
                  background: done ? bg : "white",      // << whole card tinted
                  boxShadow: "0 8px 24px rgba(2,6,23,.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{task.title}</strong>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    ({task.points} pts)
                  </span>

                  {done && label && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "4px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: chipText,
                        background: chipBg,
                        border: `1px solid ${border}`,
                      }}
                    >
                      {label}
                    </span>
                  )}

                  <div style={{ marginLeft: "auto" }}>
                    {done && !editing && (
                      <button onClick={() => startResubmit(task._id)}>
                        Resubmit
                      </button>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div style={{ marginTop: 8 }}>
                  <textarea
                    rows={3}
                    placeholder="Write your note here"
                    value={drafts[task._id]?.note || ""}
                    onChange={(e) => setDraft(task._id, { note: e.target.value })}
                    disabled={locked}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      background: done ? panelBg : "transparent", // << inner block shows card color
                      borderColor: done ? border : "#e5e7eb",
                    }}
                  />
                </div>

                {/* File + Submit + Proof */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 8,
                    background: done ? panelBg : "transparent", // << inner block tinted
                    border: `1px dashed ${done ? border : "#e5e7eb"}`,
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={locked}
                    onChange={(e) =>
                      setDraft(task._id, { file: e.target.files?.[0] || null })
                    }
                  />
                  <button
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
                    >
                      View proof
                    </a>
                  )}
                </div>

                {/* Reviews / Progress box */}
                {done && (
                  <div
                    style={{
                      marginTop: 10,
                      background: panelBg,                 // << tinted
                      border: `1px dashed ${border}`,
                      borderRadius: 6,
                      padding: "10px 12px",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {summary || approvals > 0 || rejections > 0 ? (
                      <div style={{ marginBottom: reviews.length ? 6 : 0 }}>
                        <strong>Review progress:</strong>{" "}
                        {approvals}/{required} approved
                        {rejections > 0 ? (
                          <span style={{ color: "#b00020" }}>
                            {" "}
                            — {rejections} rejected
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {reviews.length > 0 ? (
                      <ul style={{ margin: "6px 0 0 16px" }}>
                        {reviews.map((r) => (
                          <li key={r.key} style={{ margin: "2px 0" }}>
                            <span style={{ fontWeight: 600 }}>{r.name}</span>{" "}
                            <span style={{ color: "#666" }}>({r.role})</span> —{" "}
                            <span
                              style={{
                                color: decisionColor(r.decision),
                                fontWeight: 600,
                              }}
                            >
                              {r.decision}
                            </span>
                            {r.comment ? <> — {r.comment}</> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: "#666" }}>
                        No reviews yet. Waiting for reviewers.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReviewsPanel
        dateStr={dateStr}
        onReviewed={() => {
          // refresh score and logs after any review action
          const qs = new URLSearchParams({ date: dateStr });
          fetch(`${API_URL}/api/score?${qs}`, { headers: authHeader })
            .then((r) =>
              r.ok
                ? r.json()
                : { total: 0, rawPoints: 0, proofBonus: 0, verifyBonus: 0 }
            )
            .then(setScore);

          fetch(`${API_URL}/api/logs?${qs}`, { headers: authHeader })
            .then((r) => (r.ok ? r.json() : []))
            .then(setLogs);
        }}
      />

      <h3>Your score today</h3>
      <p>
        Total {score.total} &nbsp; Raw {score.rawPoints} &nbsp; Proof bonus{" "}
        {score.proofBonus} &nbsp; Verify bonus {score.verifyBonus}
      </p>

      {/* TEAM LIFETIME SCOREBOARD (visible to all users) */}
      <Scoreboard /> {/* <-- ADDED */}
    </div>
  );
}
