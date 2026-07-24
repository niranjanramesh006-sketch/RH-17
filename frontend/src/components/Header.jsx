import { useState } from "react"
import VoiceCall from "./VoiceCall"

function Header({ domain, user, onDomainSelect }) {
  const [inCall, setInCall] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const modules = user?.enabled_modules || ["general"]

  const moduleConfig = {
    general:    { label: "General",    color: "#4C8DFF" },
    healthcare: { label: "Healthcare", color: "#3FBF8F" },
    education:  { label: "Education",  color: "#5B8DEF" },
    hr:         { label: "HR",         color: "#9E8CFA" },
    support:    { label: "Support",    color: "#E2A23C" },
    sales:      { label: "Sales",      color: "#F0618C" },
  }

  const subtitles = {
    healthcare: "I'll answer from your clinical guidelines and care records.",
    education:  "I'll answer from your course materials and student records.",
    hr:         "I'll answer from your HR documents, policies, and records.",
    support:    "I'll answer from your product docs and ticket history.",
    sales:      "I'll answer from your playbooks and pricing sheets.",
    general:    "Answers from your company documents.",
  }

  const current = moduleConfig[domain] || moduleConfig.general

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="crumb">{user?.bot_name || "UniAssist AI"}</div>
          <div className="crumb-sub">
            {user?.tenant_name} · {subtitles[domain]}
          </div>
        </div>
        <div className="topbar-right">
          {/* Module switcher — only show if multiple modules */}
          {modules.length > 1 && (
            <div style={{ position: "relative" }}>
              <div
                className="module-switch"
                onClick={() => setMenuOpen(m => !m)}
              >
                <span className="dot" />
                <span>{current.label}</span>
                <span>▾</span>
              </div>
              <div className={`module-menu ${menuOpen ? "open" : ""}`}>
                {modules.map(m => (
                  <div
                    key={m}
                    className="module-opt"
                    onClick={() => {
                      onDomainSelect(m)
                      document.documentElement.setAttribute("data-module", m)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="sw" style={{ background: moduleConfig[m]?.color || "#4C8DFF" }} />
                    {moduleConfig[m]?.label || m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call button */}
          <button className="call-btn" onClick={() => setInCall(true)}>
            <span className="pulse" />
            Call
          </button>
        </div>
      </div>

      {inCall && <VoiceCall domain={domain} onClose={() => setInCall(false)} />}
    </>
  )
}

export default Header