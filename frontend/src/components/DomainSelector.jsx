import { useState, useEffect } from "react"
import { API } from "../config"

function DomainSelector({ selected, onSelect }) {
  const [domains, setDomains] = useState([])
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetch(`${API}/domains`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setDomains(data.domains || []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-3 border-b border-zinc-800">
      <p className="text-zinc-400 text-xs mb-2">Module</p>
      <div className="flex flex-col gap-1">
        {domains.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`text-left text-sm px-3 py-2 rounded-lg transition ${
              selected === d.id
                ? "bg-white text-black font-medium"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {d.icon} {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DomainSelector