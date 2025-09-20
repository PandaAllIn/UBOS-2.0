import React, { useEffect, useState } from 'react'
import { getJSON } from '../lib/api'
import StatusCard from '../components/StatusCard'

type Sub = { provider:string, plan:string, status:string, cost?:number }

export default function Subscriptions(){
  const [data,setData]=useState<Sub[]>([])
  const [err,setErr]=useState<string| null>(null)
  useEffect(()=>{(async()=>{try{setErr(null); const s = await getJSON<Sub[]>('/api/subscriptions'); setData(s)}catch(e:unknown){setErr((e as Error).message)}})()},[])
  const toState = (s:string): 'ok'|'warn'|'err' => s?.toLowerCase().includes('active') ? 'ok' : s?.toLowerCase().includes('trial') ? 'warn' : 'err'
  return (
    <div style={{padding:16}}>
      <h2>Subscriptions</h2>
      {err && <div style={{color:'#ef476f'}}>Error: {err}</div>}
      <div className="grid">
        {data.map((s,i)=> (
          <StatusCard key={i} title={`${s.provider} • ${s.plan}`} state={toState(s.status)} description={s.cost?`$${s.cost}`:undefined} />
        ))}
      </div>
    </div>
  )
}
