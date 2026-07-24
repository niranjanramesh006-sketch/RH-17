import { useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"

function MessageBubble({ role, content }) {
  const isUser = role === "user"
  return (
    <div style={{
      display: "flex",
      gap: "10px",
      alignItems: "flex-start",
      flexDirection: isUser ? "row-reverse" : "row",
      marginBottom: "16px"
    }}>
      <div style={{
        width: "28px", height: "28px",
        borderRadius: "50%",
        background: isUser ? "var(--accent)" : "var(--surface-3)",
        color: isUser ? "white" : "var(--text-dim)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: "500", flexShrink: 0, marginTop: "2px"
      }}>
        {isUser ? "Y" : "🤖"}
      </div>
      <div style={{
        maxWidth: "72%",
        padding: "12px 16px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "var(--accent)" : "var(--surface)",
        color: isUser ? "white" : "var(--text)",
        fontSize: "13.5px",
        lineHeight: "1.7",
        border: isUser ? "none" : "1px solid var(--border)"
      }}>
        {isUser ? content : (
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p style={{ margin: "0 0 8px 0" }} {...props} />,
              ul: ({node, ...props}) => <ul style={{ paddingLeft: "18px", margin: "6px 0" }} {...props} />,
              ol: ({node, ...props}) => <ol style={{ paddingLeft: "18px", margin: "6px 0" }} {...props} />,
              li: ({node, ...props}) => <li style={{ margin: "3px 0" }} {...props} />,
              strong: ({node, ...props}) => <strong style={{ color: "var(--accent)", fontWeight: 600 }} {...props} />,
              code: ({node, ...props}) => <code style={{ background: "var(--surface-3)", padding: "1px 5px", borderRadius: "4px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }} {...props} />,
              h1: ({node, ...props}) => <h1 style={{ fontSize: "16px", fontWeight: 600, margin: "8px 0 4px", color: "var(--text)" }} {...props} />,
              h2: ({node, ...props}) => <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "8px 0 4px", color: "var(--text)" }} {...props} />,
              h3: ({node, ...props}) => <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 3px", color: "var(--text)" }} {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

function ChatBox({ messages, onChipClick }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const chips = [
    "What is our leave policy?",
    "How do I submit a reimbursement?",
    "Who do I contact about payroll?"
  ]

  return (
    <div className="chat-scroll">
      <div className="chat-inner">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-mark">💬</div>
            <div className="empty-title">
              How can I help, <span className="accent-word">today</span>?
            </div>
            <div className="empty-sub">
              Ask me anything — I'll answer from your company's documents, policies, and records.
            </div>
            <div className="chip-row">
              {chips.map(chip => (
                <div key={chip} className="chip" onClick={() => onChipClick && onChipClick(chip)}>
                  {chip}
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default ChatBox