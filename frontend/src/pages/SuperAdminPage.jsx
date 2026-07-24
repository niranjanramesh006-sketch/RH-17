import { useState, useEffect } from "react"
import { API } from "../config"

function SuperAdminPage({ onBack }) {
  const [view, setView] = useState("list")
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const token = localStorage.getItem("token")
  const [analytics, setAnalytics] = useState(null)
  const [activeNav, setActiveNav] = useState("tenants")
  const [settings, setSettings] = useState({
    groq_model: "llama-3.3-70b-versatile",
    platform_name: "UniAssist AI",
    default_modules: ["general"],
    smtp_email: ""
  })
  const [settingsSaved, setSettingsSaved] = useState(false)
  useEffect(() => { 
    fetchTenants() 
    fetchAnalytics() 
  }, [])
  
  const [form, setForm] = useState({
    name: "", slug: "", bot_name: "UniAssist AI",
    bot_description: "Your AI assistant",
    enabled_modules: [],
    admin_name: "", admin_email: "", admin_password: ""
  })

  const moduleConfig = [
    { id: "general",    label: "General",    icon: "💼", color: "#4C8DFF", soft: "rgba(76,141,255,.14)" },
    { id: "healthcare", label: "Healthcare",  icon: "🏥", color: "#3FBF8F", soft: "rgba(63,191,143,.16)" },
    { id: "education",  label: "Education",   icon: "🎓", color: "#5B8DEF", soft: "rgba(91,141,239,.16)" },
    { id: "hr",         label: "HR",          icon: "👥", color: "#9E8CFA", soft: "rgba(158,140,250,.16)" },
    { id: "support",    label: "Support",     icon: "🎧", color: "#E2A23C", soft: "rgba(226,162,60,.16)" },
    { id: "sales",      label: "Sales",       icon: "📈", color: "#F0618C", soft: "rgba(240,97,140,.15)" },
  ]

  const moduleColors = {
    general: ["rgba(76,141,255,.14)", "#4C8DFF"],
    healthcare: ["rgba(63,191,143,.16)", "#3FBF8F"],
    education: ["rgba(91,141,239,.16)", "#5B8DEF"],
    hr: ["rgba(158,140,250,.16)", "#9E8CFA"],
    support: ["rgba(226,162,60,.16)", "#E2A23C"],
    sales: ["rgba(240,97,140,.15)", "#F0618C"],
  }

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API}/tenants/list`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setTenants(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API}/admin/platform/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setAnalytics(data)
    } catch (e) {}
  }

  const toggleModule = (moduleId) => {
    setForm(prev => ({
      ...prev,
      enabled_modules: prev.enabled_modules.includes(moduleId)
        ? prev.enabled_modules.filter(m => m !== moduleId)
        : [...prev.enabled_modules, moduleId]
    }))
  }

  const createTenant = async () => {
    if (!form.name || !form.slug || !form.admin_email || !form.admin_password || !form.admin_name) {
      setMessage("Please fill all required fields")
      return
    }
    if (form.enabled_modules.length === 0) {
      setMessage("Select at least one module")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch(`${API}/tenants/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.tenant_id) {
        setMessage(`✅ Tenant created! Slug: ${data.slug}`)
        setView("list")
        fetchTenants()
        setForm({ name: "", slug: "", bot_name: "UniAssist AI", bot_description: "Your AI assistant", enabled_modules: [], admin_name: "", admin_email: "", admin_password: "" })
      } else {
        setMessage(data.detail || "Failed to create tenant")
      }
    } catch (e) {
      setMessage("Server error")
    }
    setLoading(false)
  }

  const s = {
    shell: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" , background: "var(--bg)", color: "var(--text)"},
    rail: {
      width: "224px", flexShrink: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", padding: "22px 14px", gap: "24px"
    },
    railTop: { display: "flex", alignItems: "center", gap: "9px", padding: "0 6px" },
    backBtn: { display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dim)", fontSize: "12.5px", fontWeight: 500, cursor: "pointer" },
    railBrand: { display: "flex", alignItems: "center", gap: "9px", padding: "0 6px" },
    orb: { width: "22px", height: "22px", borderRadius: "50%", background: "radial-gradient(circle at 32% 32%, #bcd6ff, #4C8DFF 55%, #8B7CFF 100%)", boxShadow: "0 0 14px rgba(76,141,255,.5)", flexShrink: 0 },
    railTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "14.5px", color: "var(--text)" },
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
    segmented: { display: "flex", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "3px" },
    segOpt: (active) => ({
      padding: "8px 16px", fontSize: "12.5px", fontWeight: 600, borderRadius: "100px", cursor: "pointer",
      background: active ? "linear-gradient(95deg, #34E7E7, #4C8DFF)" : "transparent",
      color: active ? "#04122E" : "var(--text-dim)"
    }),
    content: { flex: 1, padding: "26px 32px", overflowY: "auto", background: "var(--bg)"  },
    tenantGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: "14px", marginTop: "16px" },
    tenantCard: {
      background: "linear-gradient(160deg, var(--surface-2), var(--surface))",
      border: "1px solid var(--border)", borderRadius: "18px", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px"
    },
    tcTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
    tcName: { fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "16.5px", color: "var(--text)" },
    statusPill: { display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", fontWeight: 600, background: "rgba(52,231,231,0.13)", color: "#34E7E7", padding: "4px 9px", borderRadius: "100px" },
    tcMeta: { fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-faint)", lineHeight: 1.8 },
    tcTags: { display: "flex", gap: "6px", flexWrap: "wrap" },
    tag: (mod) => ({
      fontSize: "10.5px", fontWeight: 600, padding: "4px 9px", borderRadius: "100px",
      background: moduleColors[mod]?.[0] || "rgba(76,141,255,.14)",
      color: moduleColors[mod]?.[1] || "#4C8DFF"
    }),
    createWrap: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden"  },
    createLeft: { flex: 1, padding: "32px", overflowY: "auto", maxHeight: "calc(100vh - 80px)"  },
    createForm: { maxWidth: "480px", display: "flex", flexDirection: "column", gap: "20px" },
    field: { display: "flex", flexDirection: "column", gap: "7px" },
    fieldLabel: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-dim)" },
    fieldInput: {
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "12px",
      padding: "12px 14px", color: "var(--text)", fontSize: "13.5px", outline: "none",
      fontFamily: "'Inter', sans-serif"
    },
    moduleGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" },
    moduleTile: (selected, color, soft) => ({
      display: "flex", flexDirection: "column", alignItems: "center", gap: "7px", padding: "14px 8px",
      background: selected ? soft : "var(--surface-2)",
      border: `1px solid ${selected ? color : "var(--border)"}`,
      borderRadius: "12px", cursor: "pointer", fontSize: "11.5px", fontWeight: 600,
      color: selected ? "var(--text)" : "var(--text-dim)", textAlign: "center"
    }),
    moduleIc: (color, soft) => ({
      width: "30px", height: "30px", borderRadius: "9px",
      background: soft, color: color,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px"
    }),
    createRight: {
      width: "340px", flexShrink: 0,
      background: "var(--surface)", borderLeft: "1px solid var(--border)",
      padding: "32px 26px", display: "flex", flexDirection: "column", gap: "16px",
      overflowY: "auto",
      maxHeight: "calc(100vh - 80px)"
    },
    previewLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-faint)" },
    previewCard: {
      background: "linear-gradient(160deg, var(--surface-3), var(--surface))",
      border: "1px solid var(--border)", borderRadius: "18px", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px"
    },
    createBtn: {
      width: "100%", border: "none", color: "#04122E", padding: "15px", borderRadius: "12px",
      fontSize: "14px", fontWeight: 700, fontFamily: "'Sora', sans-serif", cursor: "pointer",
      background: "linear-gradient(95deg, #34E7E7, #4C8DFF 65%, #8B7CFF)",
      boxShadow: "0 10px 28px -8px rgba(76,141,255,.55)", marginTop: "auto"
    },
  }

  return (
    <div style={s.shell}>
      {/* Rail */}
      <aside style={s.rail}>
        <div style={s.railTop}>
          <div style={s.backBtn} onClick={onBack}>← Back</div>
        </div>
        <div style={s.railBrand}>
          <div style={s.orb} />
          <div style={s.railTitle}>Super Admin</div>
        </div>
        <div style={s.railNav}>
          <div style={s.railItem(activeNav === "tenants")} onClick={() => setActiveNav("tenants")}>
            🏢 Tenants
          </div>
          <div style={s.railItem(activeNav === "analytics")} onClick={() => setActiveNav("analytics")}>
            📊 Analytics
          </div>
          <div style={s.railItem(activeNav === "settings")} onClick={() => setActiveNav("settings")}>
            ⚙️ Settings
          </div>
        </div>
        <div style={s.railFoot}>v1.0 · platform</div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topbar}>
          <h1 style={s.topbarTitle}>
            {activeNav === "analytics" ? "Platform analytics" :
            activeNav === "settings" ? "Settings" :
            view === "list" ? "All tenants" : "New tenant"}
          </h1>
          {activeNav === "tenants" && (
            <div style={s.segmented}>
              <div style={s.segOpt(view === "list")} onClick={() => setView("list")}>All tenants</div>
              <div style={s.segOpt(view === "create")} onClick={() => setView("create")}>New tenant</div>
            </div>
          )}
        </div>

        {message && (
          <div style={{
            margin: "16px 32px 0",
            padding: "12px 16px", borderRadius: "12px", fontSize: "13px",
            background: message.startsWith("✅") ? "rgba(63,191,143,0.13)" : "rgba(240,97,140,0.13)",
            color: message.startsWith("✅") ? "#3FBF8F" : "#F0618C",
            border: `1px solid ${message.startsWith("✅") ? "rgba(63,191,143,0.3)" : "rgba(240,97,140,0.3)"}`
          }}>
            {message}
          </div>
        )}

        {/* TENANTS LIST */}
        {activeNav === "tenants" && view === "list" && (
          <div style={s.content}>
            <div style={s.tenantGrid}>
              {tenants.map(t => (
                <div key={t.id} style={s.tenantCard}>
                  <div style={s.tcTop}>
                    <div style={s.tcName}>{t.name}</div>
                    <div style={s.statusPill}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34E7E7", boxShadow: "0 0 6px #34E7E7" }} />
                      Active
                    </div>
                  </div>
                  <div style={s.tcMeta}>
                    <span style={{ color: "var(--text-dim)" }}>Slug</span> {t.slug}<br />
                    <span style={{ color: "var(--text-dim)" }}>Bot</span> {t.bot_name}<br />
                    <span style={{ color: "var(--text-dim)" }}>Created</span> {new Date(t.created_at).toLocaleDateString()}
                  </div>
                  <div style={s.tcTags}>
                    {t.enabled_modules?.map(m => (
                      <span key={m} style={s.tag(m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATE VIEW */}
        {activeNav === "tenants" && view === "create" && (
          <div style={s.createWrap}>
            <div style={s.createLeft}>
              <div style={s.createForm}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "#34E7E7" }}>
                  Tenant details
                </div>
                {[
                  { label: "Company name", key: "name", placeholder: "ABC Hospital" },
                  { label: "Company slug", key: "slug", placeholder: "abc-hospital", mono: true },
                  { label: "Bot name", key: "bot_name", placeholder: "MedAssist AI" },
                  { label: "Bot description", key: "bot_description", placeholder: "Your AI assistant" },
                ].map(f => (
                  <div key={f.key} style={s.field}>
                    <label style={s.fieldLabel}>{f.label}</label>
                    <input
                      style={{ ...s.fieldInput, fontFamily: f.mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif" }}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: f.key === "slug" ? e.target.value.toLowerCase().replace(/\s/g, "-") : e.target.value }))}
                    />
                  </div>
                ))}
                <div style={s.field}>
                  <label style={s.fieldLabel}>Enabled modules</label>
                  <div style={s.moduleGrid}>
                    {moduleConfig.map(m => (
                      <div key={m.id} style={s.moduleTile(form.enabled_modules.includes(m.id), m.color, m.soft)} onClick={() => toggleModule(m.id)}>
                        <div style={s.moduleIc(m.color, m.soft)}>{m.icon}</div>
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ ...s.field, paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "#34E7E7", marginBottom: "8px" }}>
                    Admin account
                  </div>
                  {[
                    { label: "Admin name", key: "admin_name", placeholder: "John Doe" },
                    { label: "Admin email", key: "admin_email", placeholder: "admin@company.com" },
                    { label: "Admin password", key: "admin_password", placeholder: "••••••••", type: "password" },
                  ].map(f => (
                    <div key={f.key} style={{ ...s.field, marginBottom: "12px" }}>
                      <label style={s.fieldLabel}>{f.label}</label>
                      <input style={s.fieldInput} type={f.type || "text"} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <aside style={s.createRight}>
              <div style={s.previewLabel}>Live preview</div>
              <div style={s.previewCard}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "17px", color: "var(--text)" }}>{form.name || "Company name"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5 }}>{form.bot_description || "Your AI assistant"}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--text-faint)" }}>{form.slug || "slug"} · {form.bot_name || "UniAssist AI"}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {form.enabled_modules.map(m => (
                    <span key={m} style={s.tag(m)}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                  ))}
                </div>
              </div>
              <button style={s.createBtn} onClick={createTenant} disabled={loading}>
                {loading ? "Creating..." : "Create tenant →"}
              </button>
              <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-faint)", cursor: "pointer" }} onClick={() => setView("list")}>
                Cancel
              </div>
            </aside>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeNav === "analytics" && (
          <div style={s.content}>
            {!analytics ? (
              <div style={{ color: "var(--text-dim)", fontSize: "14px" }}>Loading analytics...</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                  {[
                    { label: "Total Tenants", value: analytics.total_tenants, icon: "🏢", color: "#4C8DFF" },
                    { label: "Total Users", value: analytics.total_users, icon: "👥", color: "#3FBF8F" },
                    { label: "Conversations", value: analytics.total_conversations, icon: "💬", color: "#9E8CFA" },
                    { label: "Total Messages", value: analytics.total_messages, icon: "📨", color: "#E2A23C" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "22px" }}>{m.icon}</div>
                      <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Sora', sans-serif", color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px", marginBottom: "20px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                    Activity per tenant
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {analytics.tenant_stats.map(t => {
                      const maxMsg = Math.max(...analytics.tenant_stats.map(x => x.messages), 1)
                      const pct = Math.round((t.messages / maxMsg) * 100)
                      return (
                        <div key={t.slug}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{t.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" }}>{t.messages} msgs · {t.users} users</span>
                          </div>
                          <div style={{ height: "6px", background: "var(--surface-3)", borderRadius: "100px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #34E7E7, #4C8DFF)", borderRadius: "100px" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                    Messages — last 7 days
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
                    {analytics.daily_stats.map(d => {
                      const maxVal = Math.max(...analytics.daily_stats.map(x => x.messages), 1)
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
              </>
            )}
          </div>
        )}
        {/* SETTINGS VIEW */}
        {activeNav === "settings" && (
          <div style={s.content}>
            <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Platform Info */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                  Platform info
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { label: "Platform name", value: "UniAssist AI", editable: false },
                    { label: "Version", value: "v1.0.0", editable: false },
                    { label: "Environment", value: "Development", editable: false },
                    { label: "Database", value: "PostgreSQL · Connected ✅", editable: false },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{item.label}</span>
                      <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Configuration */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                  AI configuration
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>LLM Provider</span>
                    <span style={{ fontSize: "13px", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>Groq API ✅</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>Active model</span>
                    <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>llama-3.3-70b-versatile</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>Fallback model</span>
                    <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>TinyLlama (local)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>Vector store</span>
                    <span style={{ fontSize: "13px", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>ChromaDB ✅</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>OCR Engine</span>
                    <span style={{ fontSize: "13px", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>Tesseract + Poppler ✅</span>
                  </div>
                </div>
              </div>

              {/* Email Configuration */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                  Email configuration
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>SMTP Provider</span>
                    <span style={{ fontSize: "13px", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>Gmail SSL ✅</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>SMTP Port</span>
                    <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>465</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>Email reminders</span>
                    <span style={{ fontSize: "13px", color: "#3FBF8F", fontFamily: "'JetBrains Mono', monospace" }}>Enabled ✅</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#34E7E7", marginBottom: "16px" }}>
                  Platform features
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { feature: "RAG — Document AI", status: true },
                    { feature: "OCR — Scanned PDFs", status: true },
                    { feature: "Semantic Memory", status: true },
                    { feature: "Voice Call", status: true },
                    { feature: "Email Tool", status: true },
                    { feature: "Reminder Scheduler", status: true },
                    { feature: "Multi-tenant Isolation", status: true },
                    { feature: "Web Search", status: true },
                    { feature: "Calculator Tool", status: true },
                  ].map(f => (
                    <div key={f.feature} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{f.feature}</span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "100px",
                        background: f.status ? "rgba(63,191,143,0.15)" : "rgba(240,97,140,0.15)",
                        color: f.status ? "#3FBF8F" : "#F0618C",
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {f.status ? "enabled" : "disabled"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div style={{ background: "rgba(240,97,140,0.06)", border: "1px solid rgba(240,97,140,0.2)", borderRadius: "18px", padding: "22px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".08em", color: "#F0618C", marginBottom: "16px" }}>
                  Danger zone
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>Clear vector cache</div>
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "3px" }}>Remove all ChromaDB embeddings — documents will need re-indexing</div>
                  </div>
                  <button style={{
                    padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(240,97,140,0.3)",
                    background: "rgba(240,97,140,0.1)", color: "#F0618C", fontSize: "12px",
                    fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    Clear cache
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SuperAdminPage