import React from 'react'

export function Upload(){
  const [dragOver, setDragOver] = React.useState(false)
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files)
    alert(`Selected ${files.length} file(s). (MVP stub)`)
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Documents</h2>
      <div
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`h-40 flex items-center justify-center rounded-lg border-2 border-dashed ${dragOver? 'border-blue-500 bg-blue-50':'border-gray-300 bg-white'}`}
      >
        <span className="text-gray-600">Drag & drop PDF/DOCX/CSV here or click to select</span>
      </div>
      <button className="rounded bg-blue-600 px-4 py-2 text-white">Start Analysis (stub)</button>
    </div>
  )
}


