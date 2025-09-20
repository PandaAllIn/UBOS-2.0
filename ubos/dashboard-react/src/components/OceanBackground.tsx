import React from 'react'

type Props = { children?: React.ReactNode, variant?: 'calm'|'active' }

export default function OceanBackground({ children, variant='calm' }: Props){
  const style: React.CSSProperties = {
    minHeight: '100%',
    background: `radial-gradient(1200px 800px at 20% -10%, rgba(10,147,150,${variant==='active'?0.45:0.35}), transparent 60%),
                  radial-gradient(1000px 700px at 120% -20%, rgba(148,210,189,${variant==='active'?0.35:0.25}), transparent 60%),
                  linear-gradient(180deg, #001219, #003049 40%, #002135 100%)`
  }
  return <div style={style}>{children}</div>
}

