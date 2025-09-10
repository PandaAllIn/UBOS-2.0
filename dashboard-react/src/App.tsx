import React, { useState } from 'react'
import TideGuide from './views/TideGuide'
import MissionControl from './views/MissionControl'
import Opportunities from './views/Opportunities'
import Tools from './views/Tools'
import Subscriptions from './views/Subscriptions'

export default function App() {
  const [view, setView] = useState<'tide' | 'mission' | 'opps' | 'tools' | 'subs'>('tide')
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
        <div style={{ fontWeight: 900 }}>UBOS Dashboard (React)</div>
        <div>
          <button onClick={() => setView('tide')} style={{ marginRight: 8 }}>Tide Guide</button>
          <button onClick={() => setView('mission')} style={{ marginRight: 8 }}>Mission Control</button>
          <button onClick={() => setView('opps')} style={{ marginRight: 8 }}>Opportunities</button>
          <button onClick={() => setView('tools')} style={{ marginRight: 8 }}>Tools</button>
          <button onClick={() => setView('subs')}>Subscriptions</button>
        </div>
      </header>
      {view === 'tide' && <TideGuide />}
      {view === 'mission' && <MissionControl />}
      {view === 'opps' && <Opportunities />}
      {view === 'tools' && <Tools />}
      {view === 'subs' && <Subscriptions />}
    </div>
  )
}
