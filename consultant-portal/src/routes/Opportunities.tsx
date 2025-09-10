const demo = [
  { title: 'Horizon Europe: AI for Trustworthy Systems', deadline: '2025-11-30', budget: '€20M', relevance: 92 },
  { title: 'Digital Europe: Cybersecurity capacity', deadline: '2025-10-12', budget: '€12M', relevance: 88 },
  { title: 'CEF Digital: 5G corridors', deadline: '2025-09-28', budget: '€35M', relevance: 75 },
]

export function Opportunities(){
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Funding Opportunities (Demo)</h2>
      <div className="space-y-2">
        {demo.map((o, idx)=> (
          <div key={idx} className="rounded-lg border bg-white p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{o.title}</div>
              <div className="text-sm text-gray-600">Deadline: {o.deadline} — Budget: {o.budget}</div>
            </div>
            <div className="text-sm text-gray-700">Relevance: {o.relevance}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}


