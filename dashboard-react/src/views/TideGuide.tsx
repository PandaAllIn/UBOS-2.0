import React, { useEffect, useState } from 'react'
import Sparkline from '../components/Sparkline'
import Modal from '../components/Modal'
import { useWebSocket } from '../hooks/useWebSocket'
import { getJSON } from '../lib/api'

type Status = any
type Alert = { level: string, message: string, timestamp: string }

const apiBase = '' // same origin

export default function TideGuide() {
  const [status, setStatus] = useState<Status | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [pill, setPill] = useState('Starting…')
  const [selected, setSelected] = useState<string | null>(null)

  async function refresh() {
    try {
      setPill('Refreshing…')
      const [s, a] = await Promise.all([
        getJSON(`${apiBase}/api/status`),
        getJSON(`${apiBase}/api/alerts`).catch(() => [])
      ])
      setStatus(s)
      setAlerts(a)
      setPill('Live')
    } catch {
      setPill('Offline')
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [])

  // Live updates via WS
  useWebSocket((msg) => {
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'status_update') setStatus(msg.data)
    if (msg.type === 'notify' || msg.type === 'activity') {
      setAlerts(prev => [...prev.slice(-5), { level: 'info', message: msg.message || 'activity', timestamp: new Date().toISOString() }])
    }
  }, [])

  const active = status?.system?.agents?.active ?? 0
  const completed = status?.system?.agents?.completed ?? 0
  const notes = status?.system?.memory?.notes ?? 0
  const opps = status?.eufmProject?.fundingOpportunities ?? 0
  const progress = status?.eufmProject?.progress ?? 0
  const phase = status?.eufmProject?.phase ?? '—'
  const citizensActive = Math.max(1, Math.floor((completed || 1) / 2))
  const mk = (n: number) => Array.from({ length: 24 }, (_, i) => Math.max(0, Math.round(n + (Math.sin(i / 2) + Math.random() - 0.5) * Math.max(1, n * 0.15))))

  return (
    <>
      <header>
        <div className="title">🌊 UBOS • Tide Guide Dashboard</div>
        <div className="controls">
          <div className="pill">{pill}</div>
          <button onClick={refresh}>Refresh</button>
        </div>
      </header>
      <main>
        <div className="grid">
          <div className="card" onClick={() => setSelected('Citizens Active')}>
            <h3>CITIZENS ACTIVE</h3>
            <div className="row"><div className="metric">{citizensActive}</div><div className="pill">24h</div></div>
            <Sparkline data={mk(citizensActive)} />
          </div>
          <div className="card" onClick={() => setSelected('Agents • Runs')}>
            <h3>AGENTS • RUNS</h3>
            <div className="row"><div className="metric">{active} / {completed}</div><div className="pill">prog {progress}%</div></div>
            <Sparkline data={mk(active + completed * 0.5)} />
          </div>
          <div className="card" onClick={() => setSelected('Memory • Notes')}>
            <h3>MEMORY • NOTES</h3>
            <div className="row"><div className="metric">{notes}</div><div className="pill">KB</div></div>
            <Sparkline data={mk(notes || 1)} />
          </div>
          <div className="card" onClick={() => setSelected('Funding Opportunities')}>
            <h3>FUNDING OPPORTUNITIES</h3>
            <div className="row"><div className="metric">{opps}</div><div className="pill">{phase}</div></div>
            <Sparkline data={mk(opps || 1)} />
          </div>
        </div>

        <div className="section">
          <h2>Recent Alerts</h2>
          <div className="list">
            {(alerts || []).slice(-6).reverse().map((a, i) => (
              <div key={i} className="item">
                <div><strong>{(a.level || 'info').toUpperCase()}</strong> — {a.message}</div>
                <div className="muted">{new Date(a.timestamp || Date.now()).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected || ''}>
          {!status ? <div>Loading…</div> : (
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Last updated: {new Date(status.timestamp || Date.now()).toLocaleString()}</div>
              <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 360, overflow: 'auto' }}>
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
          )}
        </Modal>
      </main>
    </>
  )
}
