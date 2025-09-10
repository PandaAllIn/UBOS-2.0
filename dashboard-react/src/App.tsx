import React, { useState } from 'react'
import TideGuide from './views/TideGuide'
import MissionControl from './views/MissionControl'

export default function App() {
  const [view, setView] = useState<'tide' | 'mission'>('tide')
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
        <div style={{ fontWeight: 900 }}>UBOS Dashboard (React)</div>
        <div>
          <button onClick={() => setView('tide')} style={{ marginRight: 8 }}>Tide Guide</button>
          <button onClick={() => setView('mission')}>Mission Control</button>
        </div>
      </header>
      {view === 'tide' ? <TideGuide /> : <MissionControl />}
    </div>
  )
}

