const getAPI = () => {
  const hostname = window.location.hostname
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://127.0.0.1:8000"
  }

  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    return envUrl
  }

  return `http://${hostname}:8000`
}

export const API = getAPI()