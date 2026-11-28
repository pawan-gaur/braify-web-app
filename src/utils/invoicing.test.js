import { describe, it, expect } from 'vitest'
import { quickPeriods, toEditable, toRequest, formatMoney, METRICS } from './invoicing'

describe('invoicing helpers', () => {
  it('quick periods are UTC calendar ranges', () => {
    const p = quickPeriods(new Date(Date.UTC(2026, 0, 15, 23, 0)))
    expect(p.thisMonth).toEqual({ from: '2026-01-01', to: '2026-01-15' })
    expect(p.lastMonth).toEqual({ from: '2025-12-01', to: '2025-12-31' })
    expect(quickPeriods(new Date(Date.UTC(2026, 2, 3))).lastMonth).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('editor state always has every metric; request keeps only enabled ones', () => {
    const e = toEditable({ currency: 'KES', monthlyFee: '5000', metrics: { EMAILS: { enabled: true, unitPrice: '0.5', included: 1000 } } })
    expect(Object.keys(e.metrics)).toHaveLength(METRICS.length)
    expect(e.metrics.SMS.enabled).toBe(false)
    const r = toRequest({ ...e, currency: ' kes ' })
    expect(r).toEqual({ currency: 'KES', monthlyFee: '5000', metrics: { EMAILS: { enabled: true, unitPrice: '0.5', included: 1000 } } })
  })

  it('formats money and survives unknown codes', () => {
    expect(formatMoney(1234.5, 'USD')).toMatch(/1,234\.50/)
    expect(formatMoney(3, 'NOPE')).toContain('3')
  })
})

import { fmtPeriod, invoiceFileName } from './invoicing'
describe('invoice formatting', () => {
  it('formats a period in UTC', () => {
    expect(fmtPeriod('2026-11-01', '2026-11-30')).toBe('1 Nov 2026 – 30 Nov 2026')
  })
  it('builds file names', () => {
    expect(invoiceFileName({ number: 'INV-2026-0001' })).toBe('INV-2026-0001.pdf')
    expect(invoiceFileName({ orgName: 'Acme Health', periodFrom: '2026-11-01' }, '-usage.xlsx')).toBe('draft-Acme-Health-2026-11-01-usage.xlsx')
  })
})

import { REMINDER_LABEL, isOpen } from './invoicing'
describe('invoice states', () => {
  it('labels reminders', () => {
    expect(REMINDER_LABEL('D-3')).toBe('3 days before due')
    expect(REMINDER_LABEL('D0')).toBe('On the due date')
    expect(REMINDER_LABEL('D+14')).toBe('14 days overdue')
  })
  it('knows which invoices are collectable', () => {
    expect(isOpen('OVERDUE')).toBe(true)
    expect(isOpen('PAID')).toBe(false)
    expect(isOpen('DRAFT')).toBe(false)
  })
})
