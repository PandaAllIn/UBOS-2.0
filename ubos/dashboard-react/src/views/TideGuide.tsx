import React, { useEffect, useState } from 'react'
import Sparkline from '../components/Sparkline'
import Modal from '../components/Modal'
import { useWebSocket } from '../hooks/useWebSocket'
import { getJSON } from '../lib/api'
import OceanBackground from '../components/OceanBackground'
import MetricCard from '../components/MetricCard'
import AlertsList from '../components/AlertsList'

type Status = unknown
type Alert = { level: string, message: string, timestamp: string }

const apiBase = '' // same origin

export default function TideGuide() {
  const [status, setStatus] = useState<Status | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [pill, setPill] = useState('Starting…')
  const [selected, setSelected] = useState<string | null>(null)
  const [trends, setTrends] = useState<unknown | null>(null)

  async function refresh() {
    try {
      setPill('Refreshing…')
      const [s, a, t] = await Promise.all([
        getJSON(`${apiBase}/api/status`),
        getJSON(`${apiBase}/api/alerts`).catch(() => []),
        getJSON(`${apiBase}/api/trends`).catch(() => null)
      ])
      setStatus(s)
      setAlerts(a)
      setTrends(t)
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
    <OceanBackground>
      <header>
        <div className="title">🌊 UBOS • Tide Guide Dashboard</div>
        <div className="controls">
          <div className="pill">{pill}</div>
          <button onClick={refresh}>Refresh</button>
        </div>
      </header>
      <main>
        <div className="grid">
          <MetricCard title="Citizens Active" value={citizensActive} badge="24h" series={mk(citizensActive)} onClick={()=>setSelected('Citizens Active')} />
          <MetricCard title="Agents • Runs" value={`${active} / ${completed}`} badge={`prog ${progress}%`} series={mk(active+completed*0.5)} onClick={()=>setSelected('Agents • Runs')} />
          <MetricCard title="Memory • Notes" value={notes} badge="KB" series={mk(notes||1)} onClick={()=>setSelected('Memory • Notes')} />
          <MetricCard title="Funding Opportunities" value={opps} badge={phase} series={mk(opps||1)} onClick={()=>setSelected('Funding Opportunities')} />
        </div>

        <div className="section">
          <h2>Recent Alerts</h2>
          <AlertsList alerts={alerts} />
        </div>

        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected || ''}>
          {!status ? <div>Loading…</div> : (
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Last updated: {new Date(status.timestamp || Date.now()).toLocaleString()}</div>
              {trends ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:6 }}>24h Agents Completed</div>
                    <Sparkline data={trends.agentsCompleted || []} />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, marginBottom:6 }}>24h Alerts</div>
                    <Sparkline data={trends.alerts || []} color="var(--warn)" />
                  </div>
                </div>
              ) : (
                <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 360, overflow: 'auto' }}>
                  {JSON.stringify(status, null, 2)}
                </pre>
              )}
            </div>
          )}
        </Modal>
      </main>
    </OceanBackground>
  )
}
