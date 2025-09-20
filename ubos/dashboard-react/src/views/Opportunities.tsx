import React, { useEffect, useMemo, useState } from 'react'
import { getJSON } from '../lib/api'

type Opp = { id:string, title:string, program:string, deadline:string, budget?:string, relevanceScore?:number, status?:string, url?:string }

export default function Opportunities(){
  const [data,setData]=useState<Opp[]>([])
  const [err,setErr]=useState<string| null>(null)
  const [loading,setLoading]=useState(false)
  const [query,setQuery]=useState('')
  const [sortBy,setSortBy]=useState<'deadline'|'relevance'|'title'>('deadline')
  const [dir,setDir]=useState<'asc'|'desc'>('asc')
  useEffect(()=>{(async()=>{
    try{ setLoading(true); setErr(null); const opps = await getJSON<Opp[]>('/api/opportunities'); setData(opps)}catch(e: unknown){setErr((e as Error).message)} finally{setLoading(false)}})()},[])
  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    const rows = data.filter(o => !q || o.title.toLowerCase().includes(q) || (o.program||'').toLowerCase().includes(q))
    rows.sort((a,b)=>{
      if (sortBy==='title') return dir==='asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      if (sortBy==='relevance') return (dir==='asc'?1:-1)*(((a.relevanceScore??0)-(b.relevanceScore??0)))
      // deadline default
      return (dir==='asc'?1:-1)* (new Date(a.deadline).getTime()-new Date(b.deadline).getTime())
    })
    return rows
  },[data, query, sortBy, dir])
  return (
    <div style={{padding:16}}>
      <h2>Funding Opportunities</h2>
      {loading && <div>Loading…</div>}
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <div style={{margin:'8px 0', display:'flex', gap:8, alignItems:'center'}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title or program" style={{flex:1, padding:8, borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'var(--text)'}} />
        <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'deadline'|'relevance'|'title')}>
          <option value="deadline">Deadline</option>
          <option value="relevance">Relevance</option>
          <option value="title">Title</option>
        </select>
        <button onClick={()=>setDir(dir==='asc'?'desc':'asc')}>{dir.toUpperCase()}</button>
        <a className="pill" href="/api/export/opportunities.csv" download>Export CSV</a>
      </div>
      <div style={{overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              <th>Title</th><th>Program</th><th>Deadline</th><th>Budget</th><th>Relevance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o=> (
              <tr key={o.id} style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                <td><a href={o.url} target="_blank" rel="noreferrer">{o.title}</a></td>
                <td>{o.program}</td>
                <td>{o.deadline}</td>
                <td>{o.budget||'—'}</td>
                <td>{o.relevanceScore ?? '—'}</td>
                <td>{o.status||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
