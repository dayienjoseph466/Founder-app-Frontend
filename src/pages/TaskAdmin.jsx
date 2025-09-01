import React, { useEffect, useMemo, useState } from "react";
import { API_URL, authHeader } from "../api";

const ROLES = ["CEO", "COO", "MARKETING", "ALL"];

export default function TaskAdmin() {
  const me = useMemo(
    () => JSON.parse(localStorage.getItem("me") || "null"),
    []
  );

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  // form (preview-only extra fields included for UI)
  const [form, setForm] = useState({
    title: "",
    role: "CEO",
    points: 5,
    isActive: true,
    // preview-only
    description: "",
    schedule: "single", // 'single' | 'recurring'
    startDate: "",
    dueDate: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setMsg("");
    try {
      const r = await fetch(`${API_URL}/api/admin/tasks`, {
        headers: authHeader(),
      });
      if (!r.ok) throw new Error(await r.text());
      setItems(await r.json());
    } catch (e) {
      setMsg(e.message || "Cannot load tasks");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Allow ADMIN (and CEO) to use Task Admin
  if (!me || (me.role !== "ADMIN" && me.role !== "CEO")) {
    return (
      <div className="taWrap">
        <p className="taNote">Only admin can open Task Admin.</p>
      </div>
    );
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        type === "checkbox" ? checked : name === "points" ? Number(value) : value,
    }));
  }

  function startEdit(t) {
    setEditingId(t._id);
    setForm((f) => ({
      ...f,
      title: t.title,
      role: t.role,
      points: t.points,
      isActive: !!t.isActive,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      role: "CEO",
      points: 5,
      isActive: true,
      description: "",
      schedule: "single",
      startDate: "",
      dueDate: "",
    });
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const body = JSON.stringify({
        title: form.title,
        role: form.role,
        points: form.points,
        isActive: form.isActive,
      }); // only fields backend knows

      const r = await fetch(
        `${API_URL}/api/admin/tasks${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body,
        }
      );

      if (!r.ok) throw new Error(await r.text());
      await load();
      resetForm();
    } catch (e) {
      setMsg(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this task?")) return;
    setMsg("");
    try {
      const r = await fetch(`${API_URL}/api/admin/tasks/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      setMsg(e.message || "Delete failed");
    }
  }

  async function toggleActive(t) {
    try {
      const r = await fetch(`${API_URL}/api/admin/tasks/${t._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          title: t.title,
          role: t.role,
          points: t.points,
          isActive: !t.isActive,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  }

  return (
    <div className="taWrap">
      {/* Breadcrumb / header */}
      <div className="taCrumb">
        <span>Admin Dashboard</span>
        <span className="sep">›</span>
        <span>Tasks</span>
        <span className="sep">›</span>
        <strong>{editingId ? "Edit Task" : "Add Task"}</strong>
      </div>

      {/* Top grid: form + preview */}
      <section className="taTop">
        <form className="taCard" onSubmit={save}>
          <h2>Add Task</h2>

          <div className="taGrid">
            {/* Title */}
            <label className="taField">
              <span>Title</span>
              <input
                name="title"
                placeholder="Enter task title"
                value={form.title}
                onChange={onChange}
                required
              />
            </label>

            {/* Role */}
            <label className="taField">
              <span>Role</span>
              <select name="role" value={form.role} onChange={onChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            {/* Points */}
            <label className="taField">
              <span>Points</span>
              <input
                name="points"
                type="number"
                min="1"
                value={form.points}
                onChange={onChange}
              />
            </label>

            {/* Start / Due (preview only) */}
            <label className="taField">
              <span>Start date</span>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={onChange}
              />
            </label>
            <label className="taField">
              <span>Due date</span>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={onChange}
              />
            </label>

            {/* Description (preview only) */}
            <label className="taField taCol2">
              <span>Description</span>
              <input
                name="description"
                placeholder="Add a text"
                value={form.description}
                onChange={onChange}
              />
            </label>

            {/* Schedule (preview only) */}
            <div className="taField taCol2">
              <span style={{ display: "block" }}>Schedule</span>
              <label className="taRadio">
                <input
                  type="radio"
                  name="schedule"
                  value="single"
                  checked={form.schedule === "single"}
                  onChange={onChange}
                />
                <i /> Single
              </label>
              <label className="taRadio">
                <input
                  type="radio"
                  name="schedule"
                  value="recurring"
                  checked={form.schedule === "recurring"}
                  onChange={onChange}
                />
                <i /> Recurring
              </label>
            </div>

            {/* Upload (preview only) */}
            <div className="taDrop taCol2">
              <div className="taDropInner">
                <div className="taDropIcon">⤴</div>
                <div>
                  <strong>Drop your file here</strong>{" "}
                  <span className="muted">or click to upload</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="taActions">
            <button className="taBtn taPrimary" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Task" : "Save Task"}
            </button>
            <button
              className="taBtn"
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              Reset
            </button>
            {editingId ? (
              <button
                className="taBtn taGhost"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            ) : null}
          </div>

          {msg ? <div className="taAlert">{msg}</div> : null}
        </form>

        {/* Preview card (UI only) */}
        <aside className="taCard taPreview">
          <h3>Task Preview</h3>
          <div className="taPreviewBox">
            <div className="taPTitle">{form.title || "Task"}</div>
            <div className="taPRow">
              <span className="muted">Role</span>
              <strong>{form.role}</strong>
            </div>
            <div className="taPRow">
              <span className="muted">Points</span>
              <strong>{form.points}</strong>
            </div>
            <div className="taPRow">
              <span className="muted">Dates</span>
              <strong>
                {form.startDate || "—"} {form.dueDate ? "– " + form.dueDate : ""}
              </strong>
            </div>
            <div className="taPRow">
              <span className="muted">Type</span>
              <strong>{form.schedule === "single" ? "Single" : "Recurring"}</strong>
            </div>
            <div className="taStatus">
              <span className={form.isActive ? "dot ok" : "dot off"} />
              {form.isActive ? "Active" : "Inactive"}
            </div>
          </div>

          {/* Mini dark list for aesthetics */}
          <div className="taMiniList">
            <div className="taMiniHead">
              <div>Title</div>
              <div>Role</div>
              <div>Points</div>
              <div>Active</div>
            </div>
            {(items || []).slice(0, 3).map((t) => (
              <div className="taMiniRow" key={t._id}>
                <div>{t.title}</div>
                <div>{t.role}</div>
                <div>{t.points}</div>
                <div>
                  <label className="taSwitch small">
                    <input
                      type="checkbox"
                      checked={!!t.isActive}
                      onChange={() => toggleActive(t)}
                    />
                    <i />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Full table */}
      <section className="taTableCard">
        <div className="taTableHead">
          <h3>Tasks</h3>
        </div>
        <div className="taTableWrap">
          <table className="taTable">
            <thead>
              <tr>
                <th>Title</th>
                <th>Role</th>
                <th>Points</th>
                <th>Active</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No tasks yet
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t._id}>
                    <td>{t.title}</td>
                    <td>{t.role}</td>
                    <td>{t.points}</td>
                    <td>
                      <label className="taSwitch">
                        <input
                          type="checkbox"
                          checked={!!t.isActive}
                          onChange={() => toggleActive(t)}
                        />
                        <i />
                      </label>
                    </td>
                    <td className="taRowActions">
                      <button className="miniBtn" onClick={() => startEdit(t)}>
                        Edit
                      </button>
                      <button
                        className="miniBtn danger"
                        onClick={() => remove(t._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
