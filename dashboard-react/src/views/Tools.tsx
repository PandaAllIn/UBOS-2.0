import React, { useEffect, useState } from 'react'
import { getJSON } from '../lib/api'

type Tool = { id:string, name:string, status:string, notes?:string }

export default function Tools(){
  const [data,setData]=useState<Tool[]>([])
  const [err,setErr]=useState<string| null>(null)
  useEffect(()=>{(async()=>{try{setErr(null); const t = await getJSON<Tool[]>('/api/tools'); setData(t)}catch(e:any){setErr(e.message)}})()},[])
  return (
    <div style={{padding:16}}>
      <h2>Tools</h2>
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <ul>
        {data.map(t=> (
          <li key={t.id}><strong>{t.name}</strong> — {t.status} {t.notes?` • ${t.notes}`:''}</li>
        ))}
      </ul>
    </div>
  )
}

