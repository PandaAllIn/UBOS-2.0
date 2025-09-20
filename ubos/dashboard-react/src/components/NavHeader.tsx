import React from 'react'

type Props = {
  title: string
  status?: string
  actions?: Array<{ label: string, onClick: () => void }>
}

export default function NavHeader({ title, status, actions = [] }: Props){
  return (
    <header aria-label={title} role="banner" style={{ display:'flex', justifyContent:'space-between', padding: 12, borderBottom:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(6px)' }}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ display: 'flex', gap: 8, alignItems:'center' }}>
        {status && <div className="pill" aria-live="polite">{status}</div>}
        {actions.map((a, i) => <button key={i} onClick={a.onClick}>{a.label}</button>)}
      </div>
    </header>
  )
}

