import { useState } from "react"

function InputBar({ onSend }) {
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput("")
  }

  return (
    <div className="composer-wrap">
      <div style={{ width: "100%", maxWidth: "680px" }}>
        <div className="composer">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="composer-actions">
            <button className="cb" title="Voice">🎙️</button>
            <button
              className="cb send-btn"
              title="Send"
              onClick={handleSend}
            >
              ➤
            </button>
          </div>
        </div>
        <div className="composer-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}

export default InputBar