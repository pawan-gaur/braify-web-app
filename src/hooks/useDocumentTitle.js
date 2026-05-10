import { useEffect } from 'react'

const APP_NAME = 'PDF Builder'

/**
 * Sets document.title to "<section> | PDF Builder"
 * Pass `null` or `undefined` to show just "PDF Builder".
 */
export default function useDocumentTitle(section) {
  useEffect(() => {
    document.title = section ? `${section} | ${APP_NAME}` : APP_NAME
    // Restore to app name when the component unmounts
    return () => { document.title = APP_NAME }
  }, [section])
}
