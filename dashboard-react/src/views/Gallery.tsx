import React from 'react'
import OceanBackground from '../components/OceanBackground'
import MetricCard from '../components/MetricCard'
import AlertsList, { Alert } from '../components/AlertsList'
import StatusCard from '../components/StatusCard'

export default function Gallery(){
  const data = Array.from({length:24}, (_,i)=> Math.round(10 + Math.sin(i/2)*3 + Math.random()*2))
  const alerts: Alert[] = [
    { level: 'info', message: 'System warmup complete', timestamp: new Date().toISOString() },
    { level: 'warning', message: 'Cost cap nearing', timestamp: new Date().toISOString() }
  ]
  return (
    <OceanBackground>
      <div style={{ padding: 16, maxWidth:1280, margin:'0 auto' }}>
        <h2>Component Gallery</h2>
        <div className="grid">
          <MetricCard title="Citizens Active" value={12} badge="24h" series={data} />
          <MetricCard title="Agents • Runs" value={"5 / 9"} badge="prog 42%" series={data} />
          <MetricCard title="Memory • Notes" value={33} badge="KB" series={data} />
          <MetricCard title="Funding Opportunities" value={7} badge="Active" series={data} />
        </div>
        <div style={{ marginTop: 16 }}>
          <AlertsList alerts={alerts} />
        </div>
        <div className="grid" style={{ marginTop: 16 }}>
          <StatusCard title="Perplexity" state="ok" description="pro plan" />
          <StatusCard title="OpenAI" state="warn" description="trial" />
          <StatusCard title="Notion" state="err" description="auth required" />
          <StatusCard title="Stripe" state="ok" description="active" />
        </div>
      </div>
    </OceanBackground>
  )
}

