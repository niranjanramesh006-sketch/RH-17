import { API } from "../config"

export const sendMessage = async (message, history = [], conversationId = null, domain = "general") => {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const response = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      message, history,
      conversation_id: conversationId,
      domain,
      tenant_name: user.tenant_name || "the company"
    }),
  })
  return response.json()
}