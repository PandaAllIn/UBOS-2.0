export function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accelerate EU Funding Workflows</h1>
      <p className="text-gray-700 max-w-2xl">Upload funding documents, validate deadlines and compliance, discover opportunities, and manage billing — all in one place.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Upload" desc="Drag & drop documents for instant checks" href="/upload"/>
        <Card title="Analysis" desc="Deadline validator and compliance checks" href="/analysis"/>
        <Card title="Opportunities" desc="Demo research results for funding programs" href="/opportunities"/>
      </div>
    </div>
  )
}

function Card({title, desc, href}:{title:string; desc:string; href:string}){
  return (
    <a href={href} className="block rounded-lg border bg-white p-4 hover:shadow-sm">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600">{desc}</div>
    </a>
  )
}


