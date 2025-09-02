import React, { useEffect, useMemo, useState } from "react";
import { API_URL, authHeader } from "../api";
import { useNavigate } from "react-router-dom";
import AnnouncementsPanel from "../components/AnnouncementsPanel"; // added

export default function AdminDashboard() {
  const nav = useNavigate();
  const [logs, setLogs] = useState([]);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const [rLogs, rBoard] = await Promise.all([
          fetch(`${API_URL}/api/admin/logs`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/scoreboard`, { headers: { ...authHeader() } }),
        ]);
        if (!rLogs.ok) throw new Error(await rLogs.text());
        if (!rBoard.ok) throw new Error(await rBoard.text());
        const logsJson = await rLogs.json();
        const boardJson = await rBoard.json();
        if (isMounted) {
          setLogs(Array.isArray(logsJson) ? logsJson : []);
          setBoard(Array.isArray(boardJson) ? boardJson : []);
        }
      } catch (e) {
        setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const stats = useMemo(() => {
    const totalUsers =
      board.length ||
      new Set(
        logs.map((l) => (typeof l.userId === "object" ? l.userId?._id : l.userId))
      ).size;

    const pending = logs.filter((l) => l.status === "PENDING").length;

    const totalLifetime = board.reduce(
      (acc, r) => acc + (Number(r.total) || 0),
      0
    );

    // Sort newest first by updatedAt/createdAt/date
    const latest = [...logs]
      .sort((a, b) => {
        const da = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime();
        const db = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime();
        return db - da;
      })
      .slice(0, 6);

    const activity = latest.map((l) => ({
      who: l.userId?.name || "Unknown",
      what: l.taskId?.title || "Task",
      status: l.status || "",
      when: l.date || "",
    }));

    return { totalUsers, pending, totalLifetime, latest, activity };
  }, [logs, board]);

  async function doResetScores() {
    try {
      setResetting(true);
      const r = await fetch(`${API_URL}/api/admin/score/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      if (!r.ok) throw new Error(await r.text());
      // Refresh data
      const [rLogs, rBoard] = await Promise.all([
        fetch(`${API_URL}/api/admin/logs`, { headers: { ...authHeader() } }),
        fetch(`${API_URL}/api/scoreboard`, { headers: { ...authHeader() } }),
      ]);
      setLogs(await rLogs.json());
      setBoard(await rBoard.json());
      setConfirmOpen(false);
      alert("Scores and submissions cleared.");
    } catch (e) {
      alert(e?.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="adShell">
      {/* Sidebar */}
      <aside className="adSidebar">
        <div className="adBrand">
          <img src="/logo.png" alt="" />
          <span>Founders App</span>
        </div>
        <nav className="adNav">
          <button className="adNav__item adNav__item--active">Dashboard</button>
          <button className="adNav__item" onClick={() => nav("/admin/tasks")}>
            Tasks
          </button>
          <button className="adNav__item" onClick={() => nav("/admin/daily")}>
            Submissions
          </button>
          <button className="adNav__item" onClick={() => nav("/admin")}>
            Users
          </button>
          <button className="adNav__item" onClick={() => nav("/admin")}>
            Scores
          </button>
          <button className="adNav__item" onClick={() => nav("/admin")}>
            Settings
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="adMain">
        {/* Hero */}
        <header className="adHero">
          <div>
            <h1>Hello Admin</h1>
            <p>Overview of users, tasks and daily submissions.</p>
          </div>
          <div className="adAvatar" title="Admin" />
        </header>

        {/* Quick actions */}
        <div className="adActions">
          <button className="adBtn" onClick={() => nav("/admin/daily")}>
            View Task Submissions
          </button>
          <button className="adBtn" onClick={() => nav("/admin/tasks")}>
            Add Task
          </button>
          <button
            className="adBtn adBtn--danger"
            onClick={() => setConfirmOpen(true)}
          >
            Delete Lifetime Score
          </button>
        </div>

        {/* Stat cards */}
        <section className="adRow">
          <article className="adCard">
            <div className="adCard__title">Total Users</div>
            <div className="adCard__value">
              {loading ? "—" : stats.totalUsers}
            </div>
          </article>

          <article className="adCard">
            <div className="adCard__title">Pending Submissions</div>
            <div className="adCard__value">
              {loading ? "—" : stats.pending}
            </div>
          </article>

          <article className="adCard">
            <div className="adCard__title">Total Lifetime Score</div>
            <div className="adCard__value">
              {loading ? "—" : stats.totalLifetime.toLocaleString()}
            </div>
          </article>
        </section>

        {/* Announcements (added) */}
        <section className="adPanel">
          <AnnouncementsPanel />
        </section>

        {/* Content grid: table + activity */}
        <section className="adGrid">
          <article className="adPanel">
            <div className="adPanel__head">
              <h3>Latest Submissions</h3>
              <button className="linkBtn" onClick={() => nav("/admin/daily")}>
                View all
              </button>
            </div>

            <div className="adTableWrap">
              <table className="adTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Points</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        Loading…
                      </td>
                    </tr>
                  ) : stats.latest.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    stats.latest.map((l) => (
                      <tr key={l._id}>
                        <td>{l.userId?.name || "—"}</td>
                        <td>{l.taskId?.title || "—"}</td>
                        <td>
                          <span
                            className={
                              "status " +
                              (l.status === "VERIFIED"
                                ? "ok"
                                : l.status === "REJECTED"
                                ? "bad"
                                : "pending")
                            }
                          >
                            {l.status || "—"}
                          </span>
                        </td>
                        <td>{l.date || "—"}</td>
                        <td>{l.taskId?.points ?? "—"}</td>
                        <td>
                          <button
                            className="miniBtn"
                            onClick={() => nav("/admin/daily")}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="adPanel">
            <div className="adPanel__head">
              <h3>Activity</h3>
            </div>
            <ul className="adActivity">
              {loading ? (
                <li>Loading…</li>
              ) : stats.activity.length === 0 ? (
                <li>No recent activity.</li>
              ) : (
                stats.activity.map((a, i) => (
                  <li key={i}>
                    <strong>{a.who}</strong>{" "}
                    <span className="muted">submitted</span>{" "}
                    <strong>{a.what}</strong>{" "}
                    <span
                      className={
                        "status inline " +
                        (a.status === "VERIFIED"
                          ? "ok"
                          : a.status === "REJECTED"
                          ? "bad"
                          : "pending")
                      }
                    >
                      {a.status}
                    </span>
                    <div className="muted small">{a.when}</div>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </section>

        {err ? <div className="adError">{err}</div> : null}
      </main>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="adModal">
          <div className="adModal__dialog">
            <div className="adModal__title">Confirm reset of lifetime score</div>
            <p className="muted">
              This will delete all scores, submissions and reviews. This action
              cannot be undone.
            </p>
            <div className="adModal__actions">
              <button className="adBtn" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className="adBtn adBtn--danger"
                onClick={doResetScores}
                disabled={resetting}
              >
                {resetting ? "Resetting…" : "Reset Score"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
