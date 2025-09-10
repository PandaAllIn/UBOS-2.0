import React, { useEffect, useState } from 'react'
import Sparkline from '../components/Sparkline'

type Status = any
type Alert = { level: string, message: string, timestamp: string }

const apiBase = '' // same origin

export default function TideGuide() {
  const [status, setStatus] = useState<Status | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [pill, setPill] = useState('Starting…')

  async function refresh() {
    try {
      setPill('Refreshing…')
      const [s, a] = await Promise.all([
        fetch(`${apiBase}/api/status`).then(r => r.json()),
        fetch(`${apiBase}/api/alerts`).then(r => r.json()).catch(() => [])
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
          <div className="card">
            <h3>CITIZENS ACTIVE</h3>
            <div className="row"><div className="metric">{citizensActive}</div><div className="pill">24h</div></div>
            <Sparkline data={mk(citizensActive)} />
          </div>
          <div className="card">
            <h3>AGENTS • RUNS</h3>
            <div className="row"><div className="metric">{active} / {completed}</div><div className="pill">prog {progress}%</div></div>
            <Sparkline data={mk(active + completed * 0.5)} />
          </div>
          <div className="card">
            <h3>MEMORY • NOTES</h3>
            <div className="row"><div className="metric">{notes}</div><div className="pill">KB</div></div>
            <Sparkline data={mk(notes || 1)} />
          </div>
          <div className="card">
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
      </main>
    </>
  )
}

