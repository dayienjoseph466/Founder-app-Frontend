import React, { useEffect, useMemo, useState } from "react";
import { API_URL, authHeader } from "../api";

const ROLES = ["CEO", "COO", "MARKETING", "ALL"];

export default function TaskAdmin(){
  const me = useMemo(()=> JSON.parse(localStorage.getItem("me")||"null"), []);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title:"", role:"CEO", points:5, isActive:true });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  async function load(){
    setMsg("");
    const r = await fetch(API_URL + "/api/admin/tasks", { headers: authHeader() });
    if(!r.ok){ setMsg("cannot load tasks"); setItems([]); return; }
    setItems(await r.json());
  }

  useEffect(()=>{ load(); }, []);

  // Allow ADMIN (and CEO) to use Task Admin
  if (!me || (me.role !== "ADMIN" && me.role !== "CEO")) {
    return <p>Only admin can open Task Admin</p>;
  }

  function onChange(e){
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : (name === "points" ? Number(value) : value) }));
  }

  function startEdit(t){
    setEditingId(t._id);
    setForm({ title: t.title, role: t.role, points: t.points, isActive: t.isActive });
  }

  function cancelEdit(){
    setEditingId(null);
    setForm({ title:"", role:"CEO", points:5, isActive:true });
  }

  async function save(e){
    e.preventDefault();
    setMsg("");
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/tasks/${editingId}` : "/api/admin/tasks";
    const r = await fetch(API_URL + url, {
      method,
      headers: { ...authHeader(), "Content-Type":"application/json" },
      body: JSON.stringify(form)
    });
    if(!r.ok){ setMsg("save failed"); return; }
    await load();
    cancelEdit();
  }

  async function remove(id){
    if(!confirm("Delete this task")) return;
    const r = await fetch(API_URL + `/api/admin/tasks/${id}`, { method:"DELETE", headers: authHeader() });
    if(!r.ok){ setMsg("delete failed"); return; }
    await load();
  }

  return (
    <div style={{padding:16}}>
      <h2>Task admin</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={save} style={{display:"grid", gap:8, maxWidth:520, marginBottom:16}}>
        <input name="title" placeholder="title" value={form.title} onChange={onChange} required />
        <div style={{display:"flex", gap:8}}>
          <select name="role" value={form.role} onChange={onChange}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input name="points" type="number" min="1" value={form.points} onChange={onChange} />
          <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange}/> active</label>
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <table border="1" cellPadding="6" style={{borderCollapse:"collapse", width:"100%"}}>
        <thead>
          <tr><th>Title</th><th>Role</th><th>Points</th><th>Active</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan="5">No tasks yet</td></tr>
          )}
          {items.map(t => (
            <tr key={t._id}>
              <td>{t.title}</td>
              <td>{t.role}</td>
              <td>{t.points}</td>
              <td>{t.isActive ? "Yes" : "No"}</td>
              <td style={{display:"flex", gap:8}}>
                <button onClick={()=>startEdit(t)}>Edit</button>
                <button onClick={()=>remove(t._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
