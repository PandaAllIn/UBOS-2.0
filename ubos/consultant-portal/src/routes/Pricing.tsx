export function Pricing(){
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pricing</h2>
      <div className="rounded-lg border bg-white p-6">
        <div className="text-2xl font-bold">€299<span className="text-base font-medium text-gray-600">/month</span></div>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700">
          <li>Deadline validation & compliance checks</li>
          <li>Funding opportunity scanning</li>
          <li>Exportable reports and summaries</li>
          <li>Email support</li>
        </ul>
        <button className="mt-6 rounded bg-blue-600 px-4 py-2 text-white">Checkout (Stripe placeholder)</button>
      </div>
    </div>
  )
}


