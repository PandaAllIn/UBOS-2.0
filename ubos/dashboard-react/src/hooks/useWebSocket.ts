import { useEffect, useRef } from 'react'
import { wsURL } from '../lib/api'

type Handler = (msg: unknown) => void

export function useWebSocket(onMessage: Handler, deps: unknown[] = []) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = wsURL()
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try { onMessage(JSON.parse(ev.data)) } catch (e) { console.error(e) }
    }
    ws.onclose = () => { wsRef.current = null }
    return () => { try { ws.close() } catch (e) { console.error(e) } }
  }, [onMessage, ...deps])

  return wsRef
}

