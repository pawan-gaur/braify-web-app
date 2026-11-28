import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { SHEET_READ_OPTS, displayTextForDatesAndPercents } from './sheet'

function roundTrip(aoa, formats = {}) {
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true })
  for (const [addr, z] of Object.entries(formats)) ws[addr].z = z
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'S')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const back = XLSX.read(new Uint8Array(buf), { type: 'array', ...SHEET_READ_OPTS })
  return back.Sheets[back.SheetNames[0]]
}

describe('displayTextForDatesAndPercents', () => {
  it('shows dates and percentages as displayed, keeps long numbers intact', () => {
    const ws = roundTrip(
      [['due', 'rate', 'phone'], [new Date(Date.UTC(2026, 0, 31)), 0.15, 919876543210]],
      { B2: '0%' })
    displayTextForDatesAndPercents(XLSX, ws)
    const [row] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    expect(typeof row.due).toBe('string')
    expect(row.due).not.toMatch(/^\d{5}$/)          // not the 45xxx serial
    expect(row.rate).toBe('15%')
    expect(row.phone).toBe(919876543210)             // untouched
  })
})
