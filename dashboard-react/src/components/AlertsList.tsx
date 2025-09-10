import React from 'react'

export type Alert = { level: string, message: string, timestamp: string }

export default function AlertsList({ alerts }: { alerts: Alert[] }){
  return (
    <div className="list">
      {(alerts || []).slice(-6).reverse().map((a, i) => (
        <div key={i} className="item">
          <div><strong>{(a.level || 'info').toUpperCase()}</strong> — {a.message}</div>
          <div className="muted">{new Date(a.timestamp || Date.now()).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

