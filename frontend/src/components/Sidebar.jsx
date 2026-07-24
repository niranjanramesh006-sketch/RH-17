import { useState, useEffect } from "react"
import { API } from "../config"
import ConfirmDialog from "./ConfirmDialog"

function Sidebar({ onLogout, user, onAdmin, onNewChat, onSelectConversation, refreshTrigger }) {
  const [conversations, setConversations] = useState([])
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const [confirmDialog, setConfirmDialog] = useState({ open: false })
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchConversations()
    fetchDocuments()
  }, [refreshTrigger])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/conversations`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API}/rag/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
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
    fetchDocuments()
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const isDark = html.getAttribute("data-theme") === "dark"
    html.setAttribute("data-theme", isDark ? "light" : "dark")
    localStorage.setItem("theme", isDark ? "light" : "dark")
  }

  const currentTheme = document.documentElement.getAttribute("data-theme")

  const deleteConversation = (e, convId, title) => {
    e.stopPropagation()
    setConfirmDialog({
      open: true,
      title: "Delete chat?",
      message: `Delete "${title}"?`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog({ open: false })
        const token = localStorage.getItem("token")
        await fetch(`${API}/conversations/${convId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        })
        fetchConversations()
      }
    })
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">🤖</div>
        <div>
          <div className="brand-name">{user?.bot_name || "UniAssist AI"}</div>
          <div className="brand-sub">{user?.tenant_name?.toLowerCase().replace(/\s/g, ".") || "uniassist.platform"}</div>
        </div>
      </div>

      {/* New Chat */}
      <div className="new-chat" onClick={onNewChat}>✏️ New chat</div>

      {/* Scrollable middle */}
      <div className="sidebar-scroll">
        {/* Recent conversations */}
        <div>
          <div className="section-label">Recent</div>
          <div className="thread-list">
            {conversations.length === 0 ? (
              <div className="thread-empty">No conversations yet — start one above.</div>
            ) : (
              <>
                {conversations.map(c => (
                  <div
                    key={c.id}
                    className="thread-item"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px", position: "relative" }}
                    onMouseEnter={e => {
                      const btn = e.currentTarget.querySelector(".del-btn")
                      if (btn) btn.style.opacity = "1"
                    }}
                    onMouseLeave={e => {
                      const btn = e.currentTarget.querySelector(".del-btn")
                      if (btn) btn.style.opacity = "0"
                    }}
                  >
                    <div
                      onClick={() => onSelectConversation(c)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", flex: 1, cursor: "pointer" }}
                    >
                      <span className="ic">💬</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px" }}>
                        {c.title}
                      </span>
                    </div>
                    <button
                      className="del-btn"
                      onClick={(e) => deleteConversation(e, c.id, c.title)}
                      style={{
                        background: "none", border: "none",
                        color: "var(--text-faint)", cursor: "pointer",
                        fontSize: "12px", padding: "2px 4px",
                        borderRadius: "4px", flexShrink: 0,
                        opacity: "0", transition: "opacity 0.15s"
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div>
            <div className="section-label">Documents</div>
            <div className="thread-list">
              {documents.map(d => (
                <div key={d.id} className="doc-item">
                  <span className="ic">📄</span>
                  <span className="doc-name">{d.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions card */}
      <div className="sidebar-card">
        <label className="sidebar-item" style={{ cursor: "pointer" }}>
          <span className="ic">📎</span>
          {uploading ? "Uploading..." : "Upload PDF"}
          <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
        {uploadMsg && <div style={{ fontSize: "11px", color: "#3FBF8F", padding: "4px 10px" }}>{uploadMsg}</div>}
        {(user?.role === "tenant_admin" || user?.role === "super_admin") && (
          <>
            <div className="divider" />
            <div className="sidebar-item" onClick={onAdmin}>
              <span className="ic">⚙️</span>
              {user?.role === "super_admin" ? "Super Admin" : "Admin Panel"}
            </div>
          </>
        )}
      </div>

      {/* User card */}
      <div className="user-card">
        <div className="avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="user-meta">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        
        <div className="icon-btn" onClick={onLogout} title="Logout">⏻</div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </aside>
  )
}

export default Sidebar