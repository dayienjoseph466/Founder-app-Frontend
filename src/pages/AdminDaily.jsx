import React, { useEffect, useMemo, useState, useCallback } from "react";
import { API_URL, authHeader } from "../api";

function todayISO(){ return new Date().toISOString().slice(0,10); }

export default function AdminDaily(){
  const me = useMemo(()=> JSON.parse(localStorage.getItem("me")||"null"), []);
  // allow ADMIN (and still allow CEO if you want)
  if (me?.role !== "ADMIN" && me?.role !== "CEO") {
    return <p style={{ padding: 16 }}>Only admin can see this page</p>;
  }

  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (d = date) => {
    setMsg("");
    try{
      const r = await fetch(`${API_URL}/api/admin/logs?date=${d}`, { headers: authHeader() });
      if(!r.ok) throw new Error("could not load");
      const data = await r.json();
      setRows(Array.isArray(data) ? data : []);
    }catch(e){
      setMsg(e.message);
      setRows([]);
    }
  }, [date]);

  useEffect(()=> { load(); }, [date, load]);

  async function handleDelete(id){
    if(!window.confirm("Delete this submission? This cannot be undone.")) return;
    try{
      const r = await fetch(`${API_URL}/api/admin/logs/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if(!r.ok){
        const t = await r.text().catch(()=> "");
        throw new Error(t || "delete failed");
      }
      setRows(prev => prev.filter(x => x._id !== id));
    }catch(e){
      alert(e.message);
    }
  }

  function DownloadLink({ proofUrl }){
    if(!proofUrl) return null;
    const href = API_URL + proofUrl;
    return (
      <a href={href} download target="_blank" rel="noreferrer">
        download
      </a>
    );
  }

  return (
    <div className="container" style={{padding:16}}>
      <h2>Admin daily submissions</h2>
      {msg && <p>{msg}</p>}

      <label style={{display:"inline-flex", gap:8, alignItems:"center"}}>
        Date
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </label>

      <table
        border="1"
        cellPadding="6"
        className="table"
        style={{borderCollapse:"collapse", width:"100%", marginTop:10}}
      >
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Task</th>
            <th>Status</th>
            <th>Note</th>
            <th>Proof</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="7">No submissions</td>
            </tr>
          )}
          {rows.map(r=>(
            <tr key={r._id}>
              <td>{r.userId?.name}</td>
              <td>{r.userId?.role}</td>
              <td>{r.taskId?.title}</td>
              <td>{r.status}</td>
              <td>{r.note}</td>
              <td>
                {r.proofUrl ? (
                  <>
                    <a href={API_URL + r.proofUrl} target="_blank" rel="noreferrer">view</a>
                    {" | "}
                    <DownloadLink proofUrl={r.proofUrl} />
                  </>
                ) : ("")}
              </td>
              <td>
                <button className="btn btnDanger" onClick={()=>handleDelete(r._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
