/**
 * Spreadsheet helpers shared by the bulk pages (bulk PDF, bulk email, bulk e-sign).
 *
 * Cell values are read raw so long numbers (phone numbers, IDs) don't turn into "9.19877E+11",
 * but date and percentage cells used to arrive as their serial / fraction (45678, 0.15). Those —
 * and only those — are replaced by the text Excel displays ("31/01/2026", "15%").
 */

/** Options for XLSX.read: keep date cells as dates and number formats, so they can be detected. */
export const SHEET_READ_OPTS = { cellDates: true, cellNF: true }

/** Rewrites date and percentage cells of a worksheet as their displayed text (in place). */
export function displayTextForDatesAndPercents(XLSX, ws) {
  if (!ws) return ws
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue
    const cell = ws[addr]
    if (!cell) continue
    const fmt = typeof cell.z === 'string' ? cell.z : ''
    const isDate = cell.t === 'd' || (cell.t === 'n' && fmt && XLSX.SSF.is_date(fmt))
    const isPercent = cell.t === 'n' && fmt.includes('%')
    if (!isDate && !isPercent) continue
    let text = cell.w
    if (!text) {
      try { text = XLSX.SSF.format(fmt || 'yyyy-mm-dd', cell.v) } catch { text = String(cell.v) }
    }
    ws[addr] = { t: 's', v: text, w: text }
  }
  return ws
}
