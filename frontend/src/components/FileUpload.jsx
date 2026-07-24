import { useState } from "react"
import { API } from "../config"

function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    const token = localStorage.getItem("token")
    const res = await fetch(`${API}/rag/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    })

    const data = await res.json()
    setMessage(data.message || data.detail)
    setUploading(false)
  }

  return (
    <div className="p-3 border-t border-zinc-800">
      <p className="text-zinc-400 text-xs mb-2">Upload PDF</p>
      <label className="w-full cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white text-sm p-2 rounded-lg flex items-center justify-center gap-2 transition">
        {uploading ? "Uploading..." : "📎 Choose PDF"}
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      {message && <p className="text-green-400 text-xs mt-2">{message}</p>}
    </div>
  )
}

export default FileUpload