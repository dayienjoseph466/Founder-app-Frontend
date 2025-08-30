import React, { useEffect, useState } from "react";
import { API_URL, authHeader } from "../api";

function todayISO(){ return new Date().toISOString().slice(0,10); }

export default function Review(){
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  async function load(){
    setMsg("");
    const r = await fetch(API_URL + `/api/reviews/pending?date=${date}`, { headers: authHeader() });
    if(!r.ok){ setMsg("could not load"); setItems([]); return; }
    setItems(await r.json());
  }

  useEffect(()=>{ load(); }, [date]);

  async function decide(logId, decision){
    const r = await fetch(API_URL + "/api/reviews", {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ logId, decision, comment: "" })
    });
    if(!r.ok){ setMsg("failed to submit"); return; }
    // refresh list
    await load();
  }

  return (
    <div style={{padding:16}}>
      <h2>Peer review</h2>
      {msg && <p>{msg}</p>}
      <label>Date
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </label>

      <ul>
        {items.length === 0 && <li>No pending items</li>}
        {items.map(l => (
          <li key={l._id} style={{marginBottom:12}}>
            <div>
              <strong>{l.userId?.name}</strong>  task  {l.taskId?.title}  
              status {l.status}  
              {l.note && <em> note {l.note}</em>}{" "}
              {l.proofUrl && <a href={API_URL + l.proofUrl} target="_blank" rel="noreferrer">proof</a>}
            </div>
            <div style={{display:"flex", gap:8, marginTop:6}}>
              <button onClick={()=>decide(l._id, "APPROVE")}>Approve</button>
              <button onClick={()=>decide(l._id, "REJECT")}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
