import React, { useEffect, useState } from 'react'
import { postJSON } from '../lib/api'

type Status = any

export default function MissionControl() {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [task, setTask] = useState('Analyze EU funding news today and suggest next actions')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  async function refresh() {
    try {
      setError(null)
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Failed to fetch status')
      const s = await res.json()
      setStatus(s)
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => { refresh() }, [])

  return (
    <div style={{ padding: 16 }}>
      <h2>EUFM Mission Control</h2>
      {error && <div style={{ color: '#ef476f' }}>Error: {error}</div>}
      <div style={{ margin: '12px 0', padding: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Orchestrator</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }} value={task} onChange={e => setTask(e.target.value)} placeholder="Describe your task" />
          <button disabled={running} onClick={async () => {
            try {
              setRunning(true); setResult(null)
              const r = await postJSON('/api/execute', { task, dryRun: false })
              setResult(r)
            } catch (e:any) { setError(e.message) } finally { setRunning(false) }
          }}>Execute</button>
        </div>
        {running && <div style={{ marginTop: 8 }}>Running…</div>}
        {result && (
          <pre style={{ marginTop: 8, background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 320, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
      {!status ? <div>Loading…</div> : (
        <>
          <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
