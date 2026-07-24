import { useState, useEffect, useRef } from "react"
import { signup, login } from "../services/authService"

function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tenantSlug, setTenantSlug] = useState("platform")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.THREE) return

    const THREE = window.THREE
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.z = 5

    // Icosahedron
    const geo = new THREE.IcosahedronGeometry(1.4, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4C8DFF,
      emissive: 0x1a3a8a,
      wireframe: false,
      roughness: 0.3,
      metalness: 0.7
    })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x34E7E7, wireframe: true, transparent: true, opacity: 0.3 })
    const wire = new THREE.Mesh(geo, wireMat)
    scene.add(wire)

    // Torus ring
    const torusGeo = new THREE.TorusGeometry(2.2, 0.02, 8, 80)
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x8B7CFF, transparent: true, opacity: 0.5 })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.rotation.x = Math.PI / 3
    scene.add(torus)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starCount = 800
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xaabbff, size: 0.04, transparent: true, opacity: 0.7 })
    scene.add(new THREE.Points(starGeo, starMat))

    // Lights
    scene.add(new THREE.AmbientLight(0x4466ff, 0.5))
    const pointLight = new THREE.PointLight(0x4C8DFF, 2, 10)
    pointLight.position.set(3, 3, 3)
    scene.add(pointLight)

    // Mouse parallax
    let mouseX = 0, mouseY = 0
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("mousemove", onMouse)

    let frameId
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      mesh.rotation.x += 0.003
      mesh.rotation.y += 0.005
      wire.rotation.x = mesh.rotation.x
      wire.rotation.y = mesh.rotation.y
      torus.rotation.z += 0.004
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05
      camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05
      camera.lookAt(scene.position)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("mousemove", onMouse)
      renderer.dispose()
    }
  }, [])
  const handleSubmit = async () => {
    if (!tenantSlug.trim()) {
      setError("Company ID is required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = isLogin
        ? await login(email, password, tenantSlug)
        : await signup(name, email, password, tenantSlug)

      if (data.token) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        onAuth(data.user)
      } else {
        setError(data.detail || "Something went wrong")
      }
    } catch (e) {
      setError("Server error")
    }
    setLoading(false)
  }

  const inputStyle = {
    width: "100%",
    background: "var(--input-bg)",
    border: "0.5px solid var(--border-color)",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "inherit"
  }

  const labelStyle = {
    fontSize: "12px",
    color: "var(--text-secondary)",
    display: "block",
    marginBottom: "4px"
  }

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      background: "radial-gradient(ellipse 120% 90% at 30% 20%, #0B1638 0%, #070B1A 45%, #03050C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 6vw",
      gap: "40px",
      fontFamily: "'Inter', sans-serif",
      color: "#EEF3FF"
    }}>
      {/* ← ADD canvas as first child */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "25%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.75
        }}
      />

      {/* Brand side */}
      <div style={{ maxWidth: "480px", paddingBottom: "4vh", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "38px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "radial-gradient(circle at 32% 32%, #bcd6ff, #4C8DFF 55%, #8B7CFF 100%)",
            boxShadow: "0 0 22px rgba(76,141,255,.65)"
          }} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "14.5px" }}>UniAssist AI</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase", color: "#34E7E7", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "16px", height: "1px", background: "#34E7E7", display: "inline-block" }} />
          Multi-tenant AI platform
        </div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "clamp(32px,4vw,50px)", lineHeight: 1.1, letterSpacing: "-.02em", background: "linear-gradient(180deg, #FFFFFF 10%, #AFC4FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Your workspace,<br />built for the<br />
          <span style={{ background: "linear-gradient(95deg, #34E7E7, #4C8DFF 55%, #8B7CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniAssist</span> galaxy.
        </div>
        <div style={{ marginTop: "18px", color: "#96A6D1", fontSize: "14.5px", lineHeight: 1.65, maxWidth: "400px" }}>
          One engine, isolated per tenant. Healthcare, education, HR, support and sales — each with its own bot, its own documents, its own orbit.
        </div>
        <div style={{ display: "flex", gap: "28px", marginTop: "38px" }}>
          {[["5", "Domains"], ["100%", "Isolated data"], ["24/7", "Live assistant"]].map(([b, s]) => (
            <div key={s}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "20px", fontWeight: 700, color: "#EEF3FF" }}>{b}</div>
              <div style={{ fontSize: "11px", color: "#56618C", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".05em" }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: "400px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(22px)",
          borderRadius: "22px",
          padding: "30px 28px 26px",
          boxShadow: "0 30px 90px -20px rgba(0,0,0,0.7)"
        }}>
          {/* Tab switch */}
          <div style={{ position: "relative", display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "100px", padding: "4px", marginBottom: "26px" }}>
            <div style={{
              position: "absolute", top: "4px", left: isLogin ? "4px" : "calc(50%)",
              width: "calc(50% - 4px)", height: "calc(100% - 8px)",
              background: "linear-gradient(95deg, #34E7E7, #4C8DFF)",
              borderRadius: "100px", transition: "left .32s cubic-bezier(.3,.9,.3,1)",
              boxShadow: "0 4px 18px rgba(76,141,255,.45)"
            }} />
            {["Sign in", "Sign up"].map((label, i) => (
              <div
                key={label}
                onClick={() => { setIsLogin(i === 0); setError("") }}
                style={{
                  flex: 1, textAlign: "center", padding: "9px 0",
                  fontSize: "12.5px", fontWeight: 600,
                  color: (isLogin && i === 0) || (!isLogin && i === 1) ? "#04070F" : "#56618C",
                  borderRadius: "100px", cursor: "pointer", position: "relative", zIndex: 1,
                  transition: "color .25s ease"
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "19px" }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </div>
          <div style={{ color: "#56618C", fontSize: "12px", marginTop: "3px", marginBottom: "20px" }}>
            {isLogin ? "Sign in to your workspace" : "Join an existing workspace"}
          </div>

          {/* Fields */}
          {[
            { label: "Company ID", id: "slug", placeholder: "abc-hospital", value: tenantSlug, onChange: e => setTenantSlug(e.target.value.toLowerCase()), show: true },
            { label: "Full name", id: "name", placeholder: "Your name", value: name, onChange: e => setName(e.target.value), show: !isLogin },
            { label: "Email", id: "email", placeholder: "you@company.com", value: email, onChange: e => setEmail(e.target.value), show: true },
            { label: "Password", id: "pass", placeholder: "••••••••", value: password, onChange: e => setPassword(e.target.value), type: "password", show: true },
          ].filter(f => f.show).map(f => (
            <div key={f.id} style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 600, color: "#56618C", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "'JetBrains Mono', monospace", marginBottom: "7px" }}>
                {f.label}
              </label>
              <div style={{ borderRadius: "11px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChange={f.onChange}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={{ width: "100%", background: "none", border: "none", outline: "none", color: "#EEF3FF", padding: "11px 13px", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
          ))}

          {error && (
            <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "#f87171" }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", border: "none", borderRadius: "12px", padding: "13.5px", marginTop: "6px",
              fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "13.5px", color: "#04070F",
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(95deg, #34E7E7, #4C8DFF 60%, #8B7CFF)",
              boxShadow: "0 10px 30px -6px rgba(76,141,255,.55)"
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign in →" : "Create account →"}
          </button>

          {/* Demo chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 16px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.09)" }} />
            <span style={{ fontSize: "10px", color: "#56618C", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>Demo accounts</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.09)" }} />
          </div>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {[
              { slug: "abc-hospital", email: "admin@abchospital.com", pass: "hospital123", color: "#3FBF8F" },
              { slug: "xyz-college", email: "admin@xyzcollege.com", pass: "college123", color: "#5B8DEF" },
              { slug: "platform", email: "admin@uniassist.ai", pass: "admin123", color: "#34E7E7" },
            ].map(d => (
              <div
                key={d.slug}
                onClick={() => { setTenantSlug(d.slug); setEmail(d.email); setPassword(d.pass); setIsLogin(true) }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "#96A6D1",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                  padding: "7px 11px", borderRadius: "100px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: d.color, display: "inline-block" }} />
                {d.slug}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage