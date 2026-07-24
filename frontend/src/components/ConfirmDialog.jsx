import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

/**
 * ConfirmDialog — in-app replacement for window.confirm()
 * Matches the cosmic dark theme (void/navy bg, violet/cyan accents).
 */
function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message = "",
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "default", // "default" | "danger"
  onConfirm,
  onCancel
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.()
      if (e.key === "Enter") onConfirm?.()
    }
    document.addEventListener("keydown", handleKeyDown)
    dialogRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  const isDanger = variant === "danger"

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(5, 5, 13, 0.7)",
        backdropFilter: "blur(4px)",
        animation: "cd-fade-in 150ms ease-out"
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-message"
        style={{
          width: "100%",
          maxWidth: "360px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(124,58,237,0.12) 0%, transparent 55%), " +
            "radial-gradient(120% 120% at 100% 100%, rgba(34,211,238,0.08) 0%, transparent 55%), " +
            "#0d0d1a",
          boxShadow: "0 20px 60px -15px rgba(0,0,0,0.7)",
          padding: "24px",
          animation: "cd-scale-in 180ms cubic-bezier(0.16,1,0.3,1)"
        }}
      >
        <h2
          id="cd-title"
          style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>

        {message && (
          <p
            id="cd-message"
            style={{ margin: "8px 0 0", fontSize: "13.5px", lineHeight: 1.5, color: "#94a3b8" }}
          >
            {message}
          </p>
        )}

        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 16px",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#cbd5e1" }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              borderRadius: "999px",
              border: "none",
              background: isDanger ? "rgba(244,63,94,0.9)" : "rgba(139,92,246,0.9)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 16px",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDanger ? "#f43f5e" : "#8b5cf6" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDanger ? "rgba(244,63,94,0.9)" : "rgba(139,92,246,0.9)" }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cd-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cd-scale-in { from { opacity: 0; transform: scale(0.96) translateY(4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>,
    document.body
  )
}

export default ConfirmDialog