import { describe, it, expect } from 'vitest'
import { parseUtc } from './date'

describe('parseUtc', () => {
  it('treats timestamps without a zone as UTC', () => {
    expect(parseUtc('2026-05-16T09:51:00').toISOString()).toBe('2026-05-16T09:51:00.000Z')
  })

  it('keeps explicit zones', () => {
    expect(parseUtc('2026-05-16T09:51:00Z').toISOString()).toBe('2026-05-16T09:51:00.000Z')
    expect(parseUtc('2026-05-16T15:21:00+05:30').toISOString()).toBe('2026-05-16T09:51:00.000Z')
  })

  it('returns null for empty input', () => {
    expect(parseUtc(null)).toBeNull()
    expect(parseUtc('')).toBeNull()
  })
})
