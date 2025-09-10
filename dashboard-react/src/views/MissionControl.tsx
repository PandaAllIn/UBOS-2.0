import React, { useEffect, useState } from 'react'

type Status = any

export default function MissionControl() {
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)

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

