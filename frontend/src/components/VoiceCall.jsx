import { useState, useRef, useEffect } from "react"
import { API } from "../config"

function VoiceCall({ domain, onClose }) {
  const [status, setStatus] = useState("idle")
  const [transcript, setTranscript] = useState("")
  const [history, setHistory] = useState([])
  const [needsEscalation, setNeedsEscalation] = useState(false)
  const [callLog, setCallLog] = useState([])
  const [duration, setDuration] = useState(0)
  const [isHolding, setIsHolding] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const token = localStorage.getItem("token")

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    setTimeout(() => {
      speak("Hello! I'm your AI assistant. Hold the mic button and speak your question.")
        .then(() => setStatus("idle"))
    }, 500)
    return () => {
      clearInterval(timerRef.current)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bars = 48
      const barW = (W / bars) - 1.5

      for (let i = 0; i < bars; i++) {
        let barH = 3
        if (analyserRef.current && status === "listening") {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          const idx = Math.floor(i * data.length / bars)
          barH = Math.max(3, (data[idx] / 255) * H * 0.85)
        } else if (status === "speaking") {
          barH = Math.max(3, Math.abs(Math.sin(Date.now() / 180 + i * 0.4)) * H * 0.65)
        } else if (status === "processing") {
          barH = Math.max(3, Math.abs(Math.sin(Date.now() / 280 + i * 0.3)) * H * 0.35)
        }

        const x = i * (barW + 1.5)
        const y = (H - barH) / 2
        const colors = {
          listening: "rgba(63,191,143,0.9)",
          speaking: "rgba(139,124,255,0.9)",
          processing: "rgba(76,141,255,0.7)",
          idle: "rgba(83,95,135,0.5)"
        }
        ctx.fillStyle = colors[status] || colors.idle
        ctx.beginPath()
        ctx.roundRect(x, y, barW, barH, 2)
        ctx.fill()
      }
    }
    draw()
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [status])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const speak = (text) => new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.pitch = 1.0
    u.volume = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"))
    if (preferred) u.voice = preferred
    u.onend = resolve
    u.onerror = resolve
    window.speechSynthesis.speak(u)
  })

  const startRecording = async () => {
    if (status === "processing" || status === "speaking") return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
        .find(t => MediaRecorder.isTypeSupported(t)) || "audio/webm"
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      audioCtx.createMediaStreamSource(stream).connect(analyser)

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        audioCtx.close()
        analyserRef.current = null
        if (audioChunksRef.current.length > 0) await processAudio(mimeType)
      }
      mediaRecorder.start(100)
      setStatus("listening")
      setIsHolding(true)
    } catch (err) {
      console.error("Mic error:", err)
      setCallLog(prev => [...prev, { role: "bot", text: "Microphone access denied. Please allow microphone permission." }])
    }
  }

  const stopRecording = () => {
    setIsHolding(false)
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
  }

  const processAudio = async (mimeType) => {
    setStatus("processing")
    setTranscript("Processing...")
    try {
      const ext = mimeType?.includes("mp4") ? "mp4" : mimeType?.includes("ogg") ? "ogg" : "webm"
      const blob = new Blob(audioChunksRef.current, { type: mimeType })
      if (blob.size < 1000) { setTranscript("Too short — hold longer"); setStatus("idle"); return }

      const formData = new FormData()
      formData.append("audio", blob, `recording.${ext}`)
      const tRes = await fetch(`${API}/voice/transcribe?domain=${domain}`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
      })
      const { text: userText } = await tRes.json()

      if (!userText?.trim()) { setTranscript("Couldn't hear — try again"); setStatus("idle"); return }

      setTranscript(userText)
      setCallLog(prev => [...prev, { role: "user", text: userText }])

      const rRes = await fetch(`${API}/voice/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text: userText, domain, history })
      })
      const rData = await rRes.json()
      const botText = rData.response

      setCallLog(prev => [...prev, { role: "bot", text: botText }])
      setNeedsEscalation(rData.needs_escalation)
      setHistory(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: botText }])

      setStatus("speaking")
      setTranscript(botText.substring(0, 80) + (botText.length > 80 ? "..." : ""))
      await speak(botText)

      if (rData.escalation_confirmed) { setStatus("idle"); setTranscript("Team notified."); return }
      setStatus("idle")
      setTranscript("Hold mic to speak again")
    } catch (err) {
      console.error(err)
      setTranscript("Error — try again")
      setStatus("idle")
    }
  }

  const endCall = () => {
    window.speechSynthesis.cancel()
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    cancelAnimationFrame(animationFrameRef.current)
    onClose()
  }

  const statusLabels = {
    idle: "Hold mic to speak",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking...",
  }

  const statusColors = {
    idle: "var(--text-faint)",
    listening: "#3FBF8F",
    processing: "#4C8DFF",
    speaking: "#8B7CFF",
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(3,5,12,0.85)",
      backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        width: "420px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "28px",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)"
      }}>

        {/* Top section */}
        <div style={{
          padding: "28px 24px 20px",
          background: "linear-gradient(160deg, var(--surface-2), var(--surface))",
          borderBottom: "1px solid var(--border)",
          textAlign: "center"
        }}>
          {/* Avatar with pulse */}
          <div style={{ position: "relative", width: "64px", margin: "0 auto 16px" }}>
            {status === "listening" && (
              <div style={{
                position: "absolute", inset: "-8px",
                borderRadius: "50%",
                background: "rgba(63,191,143,0.15)",
                animation: "pulse 1.5s infinite"
              }} />
            )}
            {status === "speaking" && (
              <div style={{
                position: "absolute", inset: "-8px",
                borderRadius: "50%",
                background: "rgba(139,124,255,0.15)",
                animation: "pulse 1s infinite"
              }} />
            )}
            <div style={{
              width: "64px", height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--surface-3), var(--surface-2))",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", position: "relative"
            }}>
              🤖
            </div>
          </div>

          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "16px", color: "var(--text)", marginBottom: "4px" }}>
            AI Assistant
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-faint)" }}>
            {formatTime(duration)}
          </div>

          {/* Waveform */}
          <canvas
            ref={canvasRef}
            width={360}
            height={48}
            style={{ display: "block", margin: "16px auto 0", opacity: 0.9 }}
          />

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "10px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: statusColors[status],
              boxShadow: `0 0 8px ${statusColors[status]}`
            }} />
            <span style={{ fontSize: "12px", color: statusColors[status], fontWeight: 500 }}>
              {statusLabels[status]}
            </span>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)"
          }}>
            <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>
              {status === "speaking" ? "Bot" : "You"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.5 }}>
              {transcript}
            </div>
          </div>
        )}

        {/* Call log */}
        {callLog.length > 0 && (
          <div style={{ maxHeight: "160px", overflowY: "auto", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
            {callLog.map((entry, i) => (
              <div key={i} style={{
                display: "flex", gap: "8px", marginBottom: "8px",
                flexDirection: entry.role === "user" ? "row-reverse" : "row"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "7px 11px",
                  borderRadius: entry.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  background: entry.role === "user" ? "var(--accent)" : "var(--surface-3)",
                  color: entry.role === "user" ? "white" : "var(--text)",
                  fontSize: "12px", lineHeight: 1.5
                }}>
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Escalation */}
        {needsEscalation && (
          <div style={{
            margin: "0 16px", padding: "10px 14px",
            background: "rgba(226,162,60,0.1)",
            border: "1px solid rgba(226,162,60,0.3)",
            borderRadius: "12px",
            fontSize: "12px", color: "#E2A23C", textAlign: "center"
          }}>
            Say "Yes" to connect with the team
          </div>
        )}

        {/* Controls */}
        <div style={{
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "20px"
        }}>
          {/* Mic button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording() }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
            disabled={status === "processing" || status === "speaking"}
            style={{
              width: "64px", height: "64px",
              borderRadius: "50%", border: "none", cursor: "pointer",
              fontSize: "24px",
              background: isHolding
                ? "linear-gradient(135deg, #3FBF8F, #34E7E7)"
                : status === "processing" || status === "speaking"
                ? "var(--surface-3)"
                : "var(--surface-2)",
              border: `1px solid ${isHolding ? "rgba(63,191,143,0.5)" : "var(--border)"}`,
              boxShadow: isHolding ? "0 0 24px rgba(63,191,143,0.4)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            {isHolding ? "🎤" : "🎙️"}
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            style={{
              width: "64px", height: "64px",
              borderRadius: "50%", border: "none", cursor: "pointer",
              fontSize: "24px",
              background: "linear-gradient(135deg, #F0618C, #c0294a)",
              boxShadow: "0 4px 20px rgba(240,97,140,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            📵
          </button>
        </div>

        <div style={{
          textAlign: "center", paddingBottom: "16px",
          fontSize: "11px", color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          Hold 🎙️ to speak · Release when done · 📵 to end
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

export default VoiceCall