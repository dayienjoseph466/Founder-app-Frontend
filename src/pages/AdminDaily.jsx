import React, { useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, authHeader } from "../api";

const ROLES = ["ANY", "CEO", "COO", "MARKETING"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function timeOf(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
}
function statusTag(s) {
  const v = String(s || "").toUpperCase();
  if (v === "VERIFIED" || v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";
  return "PENDING";
}

export default function AdminDaily() {
  const me = useMemo(() => JSON.parse(localStorage.getItem("me") || "null"), []);
  if (me?.role !== "ADMIN" && me?.role !== "CEO") {
    return <p style={{ padding: 16 }}>Only admin can see this page</p>;
  }

  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ANY");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (d = date) => {
      setMsg("");
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/admin/logs?date=${d}`, {
          headers: authHeader(),
        });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
        setSelected(null);
      } catch (e) {
        setMsg(e.message || "Could not load submissions");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [date]
  );

  useEffect(() => {
    load();
  }, [date, load]);

  const counts = useMemo(() => {
    const c = { total: rows.length, pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      const s = statusTag(r.status);
      if (s === "PENDING") c.pending++;
      else if (s === "APPROVED") c.approved++;
      else if (s === "REJECTED") c.rejected++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const st = statusTag(r.status);
      if (statusFilter !== "ALL" && st !== statusFilter) return false;
      if (roleFilter !== "ANY" && (r.userId?.role || "") !== roleFilter) return false;
      if (!q) return true;
      const hay =
        `${r.userId?.name || ""} ${r.userId?.role || ""} ${r.taskId?.title || ""} ${r.note || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, roleFilter, statusFilter]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this submission? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API_URL}/api/admin/logs/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!r.ok) throw new Error(await r.text());
      setRows((prev) => prev.filter((x) => x._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  function exportCSV() {
    const headers = ["User", "Role", "Task", "Status", "Note", "Submitted At", "Points"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const row = [
        JSON.stringify(r.userId?.name || ""),
        JSON.stringify(r.userId?.role || ""),
        JSON.stringify(r.taskId?.title || ""),
        JSON.stringify(statusTag(r.status)),
        JSON.stringify(r.note || ""),
        JSON.stringify(timeOf(r.createdAt)),
        JSON.stringify(r.taskId?.points ?? ""),
      ];
      lines.push(row.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `submissions_${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="dsWrap">
      <header className="dsHero">
        <div className="dsCrumb">
          <span>Admin Dashboard</span>
          <span className="sep">›</span>
          <strong>Daily Submissions</strong>
        </div>
        <h1>Daily Submissions</h1>
      </header>

      <section className="dsChips">
        <button
          className={`dsChip ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          Total submissions <span className="count">{counts.total}</span>
        </button>
        <button
          className={`dsChip ${statusFilter === "PENDING" ? "active" : ""}`}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending <span className="count">{counts.pending}</span>
        </button>
        <button
          className={`dsChip ${statusFilter === "APPROVED" ? "active" : ""}`}
          onClick={() => setStatusFilter("APPROVED")}
        >
          Approved <span className="count">{counts.approved}</span>
        </button>
        <button
          className={`dsChip ${statusFilter === "REJECTED" ? "active" : ""}`}
          onClick={() => setStatusFilter("REJECTED")}
        >
          Rejected <span className="count">{counts.rejected}</span>
        </button>
      </section>

      <section className="dsMain">
        {/* Left: table area */}
        <div className="dsLeft">
          <div className="dsFilters">
            <div className="dsControl">
              <span className="ico" aria-hidden>📅</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="dsControl grow">
              <span className="ico" aria-hidden>🔎</span>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dsControl">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "ANY" ? "Any role" : r}
                  </option>
                ))}
              </select>
            </div>

            <button className="dsBtn outline" onClick={exportCSV}>⇩ Export</button>
          </div>

          <div className="dsTableCard">
            <div className="dsTableWrap">
              <table className="dsTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Submitted at</th>
                    <th>Points</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="muted center">Loading…</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="muted center">
                        No submissions
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const st = statusTag(r.status);
                      return (
                        <tr
                          key={r._id}
                          onClick={() => setSelected(r)}
                          className={selected?._id === r._id ? "selected" : ""}
                        >
                          <td className="linklike">{r.userId?.name || "-"}</td>
                          <td>{r.userId?.role || "-"}</td>
                          <td>{r.taskId?.title || "-"}</td>
                          <td>
                            <span className={`dsTag ${st.toLowerCase()}`}>{st}</span>
                          </td>
                          <td>{timeOf(r.createdAt)}</td>
                          <td>{r.taskId?.points ?? "-"}</td>
                          <td className="rowActions">
                            <button className="mini danger" onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: detail panel */}
        <aside className="dsSide">
          <div className="dsCard">
            {!selected ? (
              <div className="muted">
                Select a submission from the table to see details here.
              </div>
            ) : (
              <>
                <h3 className="dsSideTitle">{selected.taskId?.title || "Task"}</h3>

                <div className="dsPerson">
                  <div className="avatar">{(selected.userId?.name || "U").slice(0, 1)}</div>
                  <div>
                    <div className="name">{selected.userId?.name || "-"}</div>
                    <div className="muted">{selected.userId?.role || "-"}</div>
                  </div>
                </div>

                <div className="dsKV">
                  <span className="k">Status</span>
                  <span className="v">
                    <span className={`dsTag ${statusTag(selected.status).toLowerCase()}`}>
                      {statusTag(selected.status)}
                    </span>
                  </span>
                </div>

                <div className="dsKV">
                  <span className="k">Submitted at</span>
                  <span className="v">{timeOf(selected.createdAt)}</span>
                </div>

                <div className="dsKV">
                  <span className="k">Points</span>
                  <span className="v">{selected.taskId?.points ?? "-"}</span>
                </div>

                {selected.note ? (
                  <div className="dsBlock">
                    <div className="dsBlockTitle">Note</div>
                    <div className="dsNote">{selected.note}</div>
                  </div>
                ) : null}

                {selected.proofUrl ? (
                  <div className="dsBlock">
                    <div className="dsBlockTitle">Attachments</div>
                    <div className="dsFiles">
                      <a
                        className="file"
                        href={API_URL + selected.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View proof
                      </a>
                      <a
                        className="file"
                        href={API_URL + selected.proofUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="dsSideActions">
                  <button className="dsBtn danger" onClick={() => handleDelete(selected._id)}>
                    Delete submission
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </section>

      {msg ? <div className="dsAlert">{msg}</div> : null}
    </div>
  );
}
