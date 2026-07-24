import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { API } from "../config"

const API = API

function AdminPage({ onBack }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [])

  const fetchStats = async () => {
    const res = await fetch(`${API}/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    const data = await res.json()
    setStats(data)
  }

  const fetchUsers = async () => {
    const res = await fetch(`${API}/admin/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    const data = await res.json()
    setUsers(data)
  }

  const updateRole = async (userId, role) => {
    await fetch(`${API}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role })
    })
    fetchUsers()
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
        <button
          onClick={onBack}
          className="bg-zinc-800 px-3 py-1 rounded-lg text-sm hover:bg-zinc-700"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-zinc-800">
        {["overview", "users"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${
              activeTab === tab
                ? "bg-white text-black"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div>
            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Users", value: stats.total_users, icon: "👥" },
                { label: "Conversations", value: stats.total_conversations, icon: "💬" },
                { label: "Total Messages", value: stats.total_messages, icon: "📨" },
              ].map((m) => (
                <div key={m.label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <p className="text-3xl mb-1">{m.icon}</p>
                  <p className="text-3xl font-bold">{m.value}</p>
                  <p className="text-zinc-400 text-sm mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Messages — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.daily_stats}>
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }}
                  />
                  <Bar dataKey="messages" fill="#ffffff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Name", "Email", "Role", "Joined", "Action"].map(h => (
                    <th key={h} className="text-left p-4 text-zinc-400 text-sm font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-zinc-800 hover:bg-zinc-800">
                    <td className="p-4 text-sm">{u.name}</td>
                    <td className="p-4 text-sm text-zinc-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.role === "admin"
                          ? "bg-white text-black"
                          : "bg-zinc-700 text-white"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="bg-zinc-800 text-white text-sm p-1 rounded border border-zinc-700"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage