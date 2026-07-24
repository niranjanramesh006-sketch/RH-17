import { useState, useEffect } from "react"
import { API } from "../config"

function TenantAdminPage({ onBack, user }) {
  const [activeNav, setActiveNav] = useState("overview")
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchDocs()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (e) {}
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API}/rag/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setDocs(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadMsg("")
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${API}/rag/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    setUploadMsg(data.message || data.detail)
    setUploading(false)
    fetchDocs()
  }

  const updateRole = async (userId, role) => {
    await fetch(`${API}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    })
    fetchUsers()
  }

  const moduleColors = {
    general:    ["rgba(76,141,255,.14)", "#4C8DFF"],
    healthcare: ["rgba(63,191,143,.16)", "#3FBF8F"],
    education:  ["rgba(91,141,239,.16)", "#5B8DEF"],
    hr:         ["rgba(158,140,250,.16)", "#9E8CFA"],
    support:    ["rgba(226,162,60,.16)", "#E2A23C"],
    sales:      ["rgba(240,97,140,.15)", "#F0618C"],
  }

  const navItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "documents", icon: "📄", label: "Documents" },
    { id: "users", icon: "👥", label: "Users" },
  ]

  const s = {
    shell: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--bg)", color: "var(--text)" },
    rail: {
      width: "224px", flexShrink: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "22px 14px", gap: "24px"
    },
    backBtn: { display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", padding: "0 6px" },
    railBrand: { display: "flex", alignItems: "center", gap: "9px", padding: "0 6px" },
    orb: {
      width: "22px", height: "22px", borderRadius: "50%",
      background: "radial-gradient(circle at 32% 32%, #bcd6ff, #4C8DFF 55%, #8B7CFF 100%)",
      boxShadow: "0 0 14px rgba(76,141,255,.5)", flexShrink: 0
    },
    railTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "14.5px", color: "var(--text)" },
    railSub: { fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" },
    railNav: { display: "flex", flexDirection: "column", gap: "2px" },
    railItem: (active) => ({
      display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px",
      borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
      background: active ? "rgba(76,141,255,0.13)" : "transparent",
      color: active ? "#4C8DFF" : "var(--text-dim)"
    }),
    railFoot: { marginTop: "auto", fontSize: "10.5px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-faint)", padding: "0 6px" },
    main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--bg)" },
    topbar: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "22px 32px", borderBottom: "1px solid var(--border)",
      background: "rgba(8,13,30,0.5)", backdropFilter: "blur(10px)"
    },
    topbarTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "19px", color: "var(--text)" },
    topbarSub: { fontSize: "12px", color: "var(--text-faint)", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" },
    content: { flex: 1, padding: "26px 32px", overflowY: "auto", background: "var(--bg)" },
    card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px", marginBottom: "16px" },
    cardLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" },
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" },
    metricCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" },
  }

  return (
    <div style={s.shell}>
      {/* Rail */}
      <aside style={s.rail}>
        <div style={s.backBtn} onClick={onBack}>← Back</div>

        <div style={s.railBrand}>
          <div style={s.orb} />
          <div>
            <div style={s.railTitle}>{user?.bot_name || "Admin Panel"}</div>
            <div style={s.railSub}>{user?.tenant_name}</div>
          </div>
        </div>

        <div style={s.railNav}>
          {navItems.map(n => (
            <div key={n.id} style={s.railItem(activeNav === n.id)} onClick={() => setActiveNav(n.id)}>
              {n.icon} {n.label}
            </div>
          ))}
        </div>

        {/* Enabled modules */}
        <div style={{ padding: "0 6px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>
            Active modules
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {(user?.enabled_modules || []).map(m => (
              <span key={m} style={{
                fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "100px",
                background: moduleColors[m]?.[0] || "rgba(76,141,255,.14)",
                color: moduleColors[m]?.[1] || "#4C8DFF",
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <div style={s.railFoot}>v1.0 · tenant_admin</div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.topbarTitle}>
              {activeNav === "overview" ? "Overview" :
               activeNav === "documents" ? "Documents" : "Users"}
            </h1>
            <div style={s.topbarSub}>{user?.tenant_name} · Admin Panel</div>
          </div>

          {activeNav === "documents" && (
            <label style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "100px", cursor: "pointer",
              background: "linear-gradient(95deg, #34E7E7, #4C8DFF)",
              color: "#04122E", fontSize: "12.5px", fontWeight: 700,
              fontFamily: "'Sora', sans-serif"
            }}>
              {uploading ? "Uploading..." : "📎 Upload PDF"}
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>

        <div style={s.content}>

          {/* OVERVIEW */}
          {activeNav === "overview" && (
            <>
              {/* Metric cards */}
              <div style={s.metricGrid}>
                {[
                  { label: "Total Users", value: stats?.total_users ?? "—", icon: "👥", color: "#3FBF8F" },
                  { label: "Conversations", value: stats?.total_conversations ?? "—", icon: "💬", color: "#9E8CFA" },
                  { label: "Total Messages", value: stats?.total_messages ?? "—", icon: "📨", color: "#E2A23C" },
                ].map(m => (
                  <div key={m.label} style={s.metricCard}>
                    <div style={{ fontSize: "22px" }}>{m.icon}</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Sora', sans-serif", color: m.color }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily chart */}
              {stats?.daily_stats && (
                <div style={s.card}>
                  <div style={s.cardLabel}>Messages — last 7 days</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
                    {stats.daily_stats.map(d => {
                      const maxVal = Math.max(...stats.daily_stats.map(x => x.messages), 1)
                      const h = Math.max(4, Math.round((d.messages / maxVal) * 100))
                      return (
                        <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" }}>{d.messages}</div>
                          <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(180deg, #4C8DFF, #8B7CFF)", borderRadius: "4px 4px 0 0", minHeight: "4px" }} />
                          <div style={{ fontSize: "9px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{d.date}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* DOCUMENTS */}
          {activeNav === "documents" && (
            <div style={s.card}>
              <div style={s.cardLabel}>Uploaded documents</div>
              {uploadMsg && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", background: "rgba(63,191,143,0.13)", color: "#3FBF8F", fontSize: "13px", border: "1px solid rgba(63,191,143,0.3)" }}>
                  {uploadMsg}
                </div>
              )}
              {docs.length === 0 ? (
                <div style={{ color: "var(--text-faint)", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>
                  No documents uploaded yet. Use the Upload PDF button above.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {docs.map(d => (
                    <div key={d.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "var(--surface-2)",
                      borderRadius: "12px", border: "1px solid var(--border)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "18px" }}>📄</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{d.filename}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                            {d.chunks} chunks · {new Date(d.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px", background: "rgba(63,191,143,0.13)", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>
                        indexed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {activeNav === "users" && (
            <div style={s.card}>
              <div style={s.cardLabel}>Team members</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {users.map(u => (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", background: "var(--surface-2)",
                    borderRadius: "12px", border: "1px solid var(--border)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #4C8DFF, #8B7CFF)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: 600, color: "white", flexShrink: 0
                      }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{u.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: new Date(u.created_at).toLocaleDateString(), fontFamily: "'JetBrains Mono', monospace", color: "var(--text-faint)" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        style={{
                          background: "var(--surface-3)", color: "var(--text)",
                          border: "1px solid var(--border)", borderRadius: "8px",
                          padding: "5px 8px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace",
                          cursor: "pointer", outline: "none"
                        }}
                      >
                        <option value="user">user</option>
                        <option value="tenant_admin">tenant_admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default TenantAdminPage