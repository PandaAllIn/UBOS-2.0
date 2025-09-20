import React, { useMemo } from 'react'

type Props = { data: number[], color?: string, height?: number }

export default function Sparkline({ data, color = 'var(--accent)', height = 42 }: Props) {
  const d = useMemo(() => {
    if (!data || data.length === 0) return ''
    const W = 240, H = height
    const min = Math.min(...data), max = Math.max(...data)
    const norm = data.map((v, i) => [i / (data.length - 1 || 1) * (W - 8) + 4, H - 6 - ((v - min) / (max - min || 1)) * (H - 12)])
    return 'M ' + norm.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
  }, [data, height])
  return (
    <svg className="spark" viewBox={`0 0 240 ${height}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

