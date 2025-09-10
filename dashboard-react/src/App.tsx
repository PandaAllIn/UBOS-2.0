import React, { useState } from 'react'
import TideGuide from './views/TideGuide'
import MissionControl from './views/MissionControl'
import Opportunities from './views/Opportunities'
import Tools from './views/Tools'
import Subscriptions from './views/Subscriptions'
import NavHeader from './components/NavHeader'
import Gallery from './views/Gallery'

export default function App() {
  const [view, setView] = useState<'tide' | 'mission' | 'opps' | 'tools' | 'subs' | 'gallery'>('tide')
  return (
    <div>
      <NavHeader
        title="UBOS Dashboard (React)"
        actions={[
          { label: 'Tide Guide', onClick: () => setView('tide') },
          { label: 'Mission Control', onClick: () => setView('mission') },
          { label: 'Opportunities', onClick: () => setView('opps') },
          { label: 'Tools', onClick: () => setView('tools') },
          { label: 'Subscriptions', onClick: () => setView('subs') },
          { label: 'Gallery', onClick: () => setView('gallery') }
        ]}
      />
      {view === 'tide' && <TideGuide />}
      {view === 'mission' && <MissionControl />}
      {view === 'opps' && <Opportunities />}
      {view === 'tools' && <Tools />}
      {view === 'subs' && <Subscriptions />}
      {view === 'gallery' && <Gallery />}
    </div>
  )
}
