import React from 'react'

type Props = {
  title: string
  state: 'ok' | 'warn' | 'err'
  description?: string
}

export default function StatusCard({ title, state, description }: Props){
  const color = state==='ok' ? 'var(--ok)' : state==='warn' ? 'var(--warn)' : 'var(--err)'
  return (
    <div className="card" style={{ borderColor: color }}>
      <h3>{title}</h3>
      <div className="row"><div className="metric" style={{ color }}>{state.toUpperCase()}</div></div>
      {description && <div className="muted" style={{ marginTop: 8 }}>{description}</div>}
    </div>
  )
}

