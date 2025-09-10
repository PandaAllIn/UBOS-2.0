import React, { useEffect, useState } from 'react'
import { getJSON } from '../lib/api'

type Opp = { id:string, title:string, program:string, deadline:string, budget?:string, relevanceScore?:number, status?:string, url?:string }

export default function Opportunities(){
  const [data,setData]=useState<Opp[]>([])
  const [err,setErr]=useState<string| null>(null)
  const [loading,setLoading]=useState(false)
  useEffect(()=>{(async()=>{
    try{ setLoading(true); setErr(null); const opps = await getJSON<Opp[]>('/api/opportunities'); setData(opps)}catch(e:any){setErr(e.message)} finally{setLoading(false)}})()},[])
  return (
    <div style={{padding:16}}>
      <h2>Funding Opportunities</h2>
      {loading && <div>Loading…</div>}
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <div style={{overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              <th>Title</th><th>Program</th><th>Deadline</th><th>Budget</th><th>Relevance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(o=> (
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

