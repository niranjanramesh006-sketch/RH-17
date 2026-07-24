import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    document.body.setAttribute("data-theme", theme)
    // Force background color
    if (theme === "dark") {
        document.body.style.background = "#191919"
        document.body.style.color = "#e8e8e6"
    } else {
        document.body.style.background = "#ffffff"
        document.body.style.color = "#1a1a1a"
    }
    localStorage.setItem("theme", theme)
    }, [theme])

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light")

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)