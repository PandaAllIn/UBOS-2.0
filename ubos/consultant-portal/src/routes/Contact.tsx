export function Contact(){
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Contact / Demo Request</h2>
      <form className="space-y-3 max-w-md">
        <input className="w-full rounded border px-3 py-2" placeholder="Name" />
        <input className="w-full rounded border px-3 py-2" placeholder="Email" />
        <textarea className="w-full rounded border px-3 py-2" placeholder="Message" rows={5}></textarea>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Send</button>
      </form>
    </div>
  )
}


