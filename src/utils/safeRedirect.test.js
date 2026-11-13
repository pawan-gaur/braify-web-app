import { describe, it, expect } from 'vitest'
import { safeAppPath } from './safeRedirect'

describe('safeAppPath', () => {
  it('keeps same-origin app paths with query and hash', () => {
    expect(safeAppPath('/esign?page=2#top')).toBe('/esign?page=2#top')
    expect(safeAppPath('/')).toBe('/')
  })

  it('rejects anything that could leave the app', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/\t/evil.com', '/.//evil.com', 'https://evil.com', 'evil.com', 'javascript:alert(1)', '', null, undefined, 42]) {
      expect(safeAppPath(bad)).toBeNull()
    }
  })
})
