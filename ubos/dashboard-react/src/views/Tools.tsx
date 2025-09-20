import React, { useEffect, useState } from 'react'
import { getJSON } from '../lib/api'
import StatusCard from '../components/StatusCard'

type Tool = { id:string, name:string, status:string, notes?:string }

export default function Tools(){
  const [data,setData]=useState<Tool[]>([])
  const [err,setErr]=useState<string| null>(null)
  useEffect(()=>{(async()=>{try{setErr(null); const t = await getJSON<Tool[]>('/api/tools'); setData(t)}catch(e:unknown){setErr((e as Error).message)}})()},[])
  const toState = (s:string): 'ok'|'warn'|'err' => s?.toLowerCase().includes('ok') ? 'ok' : s?.toLowerCase().includes('warn') ? 'warn' : 'err'
  return (
    <div style={{padding:16}}>
      <h2>Tools</h2>
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <div className="grid">
        {data.map(t=> <StatusCard key={t.id} title={t.name} state={toState(t.status)} description={t.notes} />)}
      </div>
    </div>
  )
}
