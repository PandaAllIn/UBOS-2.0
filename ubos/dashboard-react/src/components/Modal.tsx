import React from 'react'

type Props = { open: boolean, onClose: () => void, title?: string, children?: React.ReactNode }

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ width: 640, maxWidth: '92%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, backdropFilter: 'blur(6px)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <button onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

