import { createContext, useContext, useState, useEffect } from 'react'

const AppCtx = createContext({})

export function AppProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('pdf-builder-theme') === 'dark'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('pdf-builder-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <AppCtx.Provider value={{ collapsed, setCollapsed, darkMode, setDarkMode }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)
