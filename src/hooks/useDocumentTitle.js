import { useEffect } from 'react'

const APP = 'Braify'

/**
 * Sets document.title to "<section> — Braify".
 * Pass `null` or `undefined` to show just "Braify".
 */
export default function useDocumentTitle(section) {
  useEffect(() => {
    document.title = section ? `${section} — ${APP}` : APP
    return () => { document.title = APP }
  }, [section])
}
