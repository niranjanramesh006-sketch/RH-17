import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import ChatBox from "./components/ChatBox"
import InputBar from "./components/InputBar"
import AuthPage from "./pages/AuthPage"
import SuperAdminPage from "./pages/SuperAdminPage"
import TenantAdminPage from "./pages/TenantAdminPage"
import { sendMessage } from "./services/chatService"
import { API } from "./config"

function App() {
  // ── ALL hooks must be here at the top — NO conditions before these ──
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showPanel, setShowPanel] = useState(null)
  const [refreshSidebar, setRefreshSidebar] = useState(0)
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  })
  const [domain, setDomain] = useState(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      const u = JSON.parse(stored)
      const modules = u.enabled_modules || ["general"]
      return modules.find(m => m !== "general") || "general"
    }
    return "general"
  })

  // ── useEffect must also be here before any return ──
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"
    document.documentElement.setAttribute("data-theme", savedTheme)
    document.documentElement.setAttribute("data-module", domain || "general")
  }, [])

  // ── Handler functions ──
  const handleAuth = (userData) => {
    setUser(userData)
    const modules = userData.enabled_modules || ["general"]
    const primary = modules.find(m => m !== "general") || "general"
    setDomain(primary)
    document.documentElement.setAttribute("data-module", primary)
    const savedTheme = localStorage.getItem("theme") || "dark"
    document.documentElement.setAttribute("data-theme", savedTheme)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setMessages([])
    setConversationId(null)
    setShowPanel(null)
  }

  const handleNewChat = () => {
    setMessages([])
    setConversationId(null)
  }

  const handleSelectConversation = async (conversation) => {
    setConversationId(conversation.id)
    setDomain(conversation.domain || domain)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API}/conversations/${conversation.id}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  const handleSend = async (text) => {
    const userMessage = { role: "user", content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const data = await sendMessage(text, history, conversationId, domain)
    if (!conversationId) {
      setConversationId(data.conversation_id)
      setRefreshSidebar(prev => prev + 1)
    }
    const aiMessage = { role: "assistant", content: data.response }
    setMessages([...updatedMessages, aiMessage])
  }

  const handleDomainSelect = (d) => {
    setDomain(d)
    document.documentElement.setAttribute("data-module", d)
    setMessages([])
    setConversationId(null)
  }

  // ── Conditional renders AFTER all hooks ──
  if (!user) return <AuthPage onAuth={handleAuth} />

  if (showPanel === "super_admin") {
    return <SuperAdminPage onBack={() => setShowPanel(null)} />
  }

  if (showPanel === "tenant_admin") {
    return <TenantAdminPage onBack={() => setShowPanel(null)} user={user} />
  }

  return (
    <div className="app">
      <div className="rail" />
      <Sidebar
        onLogout={handleLogout}
        user={user}
        onAdmin={() => user.role === "super_admin"
          ? setShowPanel("super_admin")
          : setShowPanel("tenant_admin")
        }
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        refreshTrigger={refreshSidebar}
      />
      <div className="main">
        <Header
          domain={domain}
          user={user}
          onDomainSelect={handleDomainSelect}
        />
        <ChatBox
          messages={messages}
          onChipClick={handleSend}
        />
        <InputBar onSend={handleSend} />
      </div>
    </div>
  )
}

export default App