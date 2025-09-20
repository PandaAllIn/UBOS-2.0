import React, { useEffect, useState } from 'react'
import { postJSON } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

type Status = unknown

export default function MissionControl() {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [task, setTask] = useState('Analyze EU funding news today and suggest next actions')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<unknown | null>(null)
  const [analysis, setAnalysis] = useState<unknown | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  async function refresh() {
    try {
      setError(null)
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Failed to fetch status')
      const s = await res.json()
      setStatus(s)
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  useEffect(() => { refresh() }, [])
  useWebSocket((msg) => {
    if (!msg || typeof msg !== 'object') return
    if ((msg as { type: string }).type === 'progress' && (msg as { message: string }).message) setLogs(prev => [...prev.slice(-20), `${(msg as { stage: string }).stage||'progress'}: ${(msg as { message: string }).message}`])
    if ((msg as { type: string }).type === 'notify' && (msg as { message: string }).message) setLogs(prev => [...prev.slice(-20), `notify: ${(msg as { message: string }).message}`])
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <h2>EUFM Mission Control</h2>
      {error && <div style={{ color: '#ef476f' }}>Error: {error}</div>}
      <div style={{ margin: '12px 0', padding: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Orchestrator</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }} value={task} onChange={e => setTask(e.target.value)} placeholder="Describe your task" />
          <button disabled={running} onClick={async () => {
            try {
              setRunning(true); setResult(null)
              const r = await postJSON('/api/execute', { task, dryRun: false })
              setResult(r)
            } catch (e:unknown) { setError((e as Error).message) } finally { setRunning(false) }
          }}>Execute</button>
          <button disabled={running} onClick={async () => {
            try {
              setRunning(true); setAnalysis(null)
              const a = await postJSON('/api/analyze', { task })
              setAnalysis(a)
            } catch (e:unknown) { setError((e as Error).message) } finally { setRunning(false) }
          }}>Analyze</button>
        </div>
        {running && <div style={{ marginTop: 8 }}>Running…</div>}
        {analysis && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>Analysis</div>
              <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 320, overflow: 'auto' }}>
                {JSON.stringify((analysis as { analyzed: unknown }).analyzed, null, 2)}
              </pre>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>Suggestions</div>
              <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 320, overflow: 'auto' }}>
                {JSON.stringify((analysis as { suggestions: unknown }).suggestions, null, 2)}
              </pre>
            </div>
          </div>
        )}
        {result && (
          <pre style={{ marginTop: 8, background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8, maxHeight: 320, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
      {!status ? <div>Loading…</div> : (
        <>
          {!!logs.length && (
            <div style={{ marginBottom: 12, background: 'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Live Events</div>
              <ul style={{ margin:0, paddingLeft:18 }}>
                {logs.slice(-8).reverse().map((l,i)=> <li key={i} className="muted">{l}</li>)}
              </ul>
            </div>
          )}
          <pre style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
