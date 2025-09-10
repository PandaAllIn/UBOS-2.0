export async function getJSON<T = any>(path: string, opts: { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000)
  try {
    const res = await fetch(path, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export function wsURL(): string {
  const { protocol, hostname, port } = window.location
  const scheme = protocol === 'https:' ? 'wss' : 'ws'
  // In dev (Vite 5175), connect to backend port 3000 for WS
  const isDev = import.meta && (import.meta as any).env && (import.meta as any).env.DEV
  const targetPort = isDev ? '3000' : (port || (protocol === 'https:' ? '443' : '80'))
  return `${scheme}://${hostname}:${targetPort}`
}

export async function postJSON<T = any>(path: string, body: any, opts: { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000)
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}
