import React from 'react'
import Sparkline from './Sparkline'

type Props = {
  title: string
  value: React.ReactNode
  badge?: React.ReactNode
  series?: number[]
  onClick?: () => void
}

export default function MetricCard({ title, value, badge, series, onClick }: Props){
  return (
    <div className="card" onClick={onClick} role={onClick?'button':undefined}>
      <h3>{title.toUpperCase()}</h3>
      <div className="row"><div className="metric">{value}</div>{badge ? <div className="pill">{badge}</div> : null}</div>
      {series ? <Sparkline data={series} /> : <div style={{height:42}}/>}
    </div>
  )
}

