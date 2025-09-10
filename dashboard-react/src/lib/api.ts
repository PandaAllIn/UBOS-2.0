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
  const { protocol, host } = window.location
  const scheme = protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${host}`
}

