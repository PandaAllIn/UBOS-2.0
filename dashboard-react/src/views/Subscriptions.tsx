import React, { useEffect, useState } from 'react'
import { getJSON } from '../lib/api'

type Sub = { provider:string, plan:string, status:string, cost?:number }

export default function Subscriptions(){
  const [data,setData]=useState<Sub[]>([])
  const [err,setErr]=useState<string| null>(null)
  useEffect(()=>{(async()=>{try{setErr(null); const s = await getJSON<Sub[]>('/api/subscriptions'); setData(s)}catch(e:any){setErr(e.message)}})()},[])
  return (
    <div style={{padding:16}}>
      <h2>Subscriptions</h2>
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <ul>
        {data.map((s,i)=> (
          <li key={i}><strong>{s.provider}</strong> — {s.plan} — {s.status} {s.cost?` • $${s.cost}`:''}</li>
        ))}
      </ul>
    </div>
  )
}

