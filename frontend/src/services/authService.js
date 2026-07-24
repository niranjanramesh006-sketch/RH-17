import { API } from "../config"


export const signup = async (name, email, password, tenantSlug) => {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, tenant_slug: tenantSlug })
  })
  return res.json()
}

export const login = async (email, password, tenantSlug) => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_slug: tenantSlug })
  })
  return res.json()
}