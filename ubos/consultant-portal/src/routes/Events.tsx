import React from 'react'

export function Events(){
  const [logs, setLogs] = React.useState<string[]>([])
  React.useEffect(()=>{
    const tenantId = '11111111-1111-1111-1111-111111111111'
    const es = new EventSource(`http://localhost:8080/v1/events?tenantId=${tenantId}`)
    es.onmessage = (e)=> setLogs((l)=>[`${new Date().toLocaleTimeString()} ${e.data}`, ...l].slice(0,50))
    es.addEventListener('task.created', (e)=> setLogs((l)=>[`${new Date().toLocaleTimeString()} task.created ${e.data}`, ...l].slice(0,50)))
    es.addEventListener('request.completed', (e)=> setLogs((l)=>[`${new Date().toLocaleTimeString()} request.completed ${e.data}`, ...l].slice(0,50)))
    return ()=> es.close()
  },[])
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Live Events</h2>
      <div className="rounded border bg-white p-3 h-96 overflow-auto text-sm font-mono">
        {logs.map((l, i)=>(<div key={i}>{l}</div>))}
      </div>
      <form onSubmit={(e)=>{e.preventDefault(); fetch('http://localhost:8080/v1/orchestrate',{method:'POST', headers:{'Content-Type':'application/json','X-Tenant-Id':'11111111-1111-1111-1111-111111111111'}, body: JSON.stringify({input:{demo:true}, async:true})})}}>
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Enqueue Demo Job</button>
      </form>
    </div>
  )
}


