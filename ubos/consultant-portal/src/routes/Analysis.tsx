export function Analysis(){
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">AI Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium">Deadline Validator</div>
          <div className="text-sm text-gray-600">Program: Horizon Europe — Due: 2025-10-15 — Days remaining: 37 — Risks: Formatting, Budget justification</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium">Research Summary</div>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Top funding calls relevant to AI safety and cybersecurity</li>
            <li>Key eligibility constraints for SMEs</li>
            <li>Submission checklist and compliance flags</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


