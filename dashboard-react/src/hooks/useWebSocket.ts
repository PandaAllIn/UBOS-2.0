import { useEffect, useRef } from 'react'
import { wsURL } from '../lib/api'

type Handler = (msg: any) => void

export function useWebSocket(onMessage: Handler, deps: any[] = []) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let alive = true
    const url = wsURL()
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try { onMessage(JSON.parse(ev.data)) } catch {}
    }
    ws.onclose = () => { wsRef.current = null }
    return () => { alive = false; try { ws.close() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return wsRef
}

