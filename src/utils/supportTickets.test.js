import { describe, it, expect } from 'vitest'
import { tabStatus, tabCount, shortType, isReference } from './supportTickets'

describe('support ticket helpers', () => {
  it('maps tabs to the backend status filter', () => {
    expect(tabStatus('active')).toBe('OPEN,IN_PROGRESS')
    expect(tabStatus('RESOLVED')).toBe('RESOLVED')
    expect(tabStatus('all')).toBe('')
    expect(tabStatus('bogus')).toBe('OPEN,IN_PROGRESS')   // unknown → default tab
  })

  it('adds up tab counts', () => {
    const counts = { OPEN: 3, IN_PROGRESS: 2, RESOLVED: 7, IGNORED: 1 }
    expect(tabCount('active', counts)).toBe(5)
    expect(tabCount('all', counts)).toBe(13)
    expect(tabCount('IGNORED', counts)).toBe(1)
    expect(tabCount('active', null)).toBeNull()
  })

  it('shortens exception class names', () => {
    expect(shortType('java.lang.NullPointerException')).toBe('NullPointerException')
    expect(shortType('Plain')).toBe('Plain')
    expect(shortType(null)).toBe('')
  })

  it('recognises reference codes', () => {
    expect(isReference('ERR-7F3K2Q')).toBe(true)
    expect(isReference(' err-7f3k2q ')).toBe(true)
    expect(isReference('ERR-0O1I23')).toBe(false)   // ambiguous characters are never issued
    expect(isReference('#1042')).toBe(false)
  })
})
