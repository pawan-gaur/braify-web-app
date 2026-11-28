import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import useUrlState, { listUrl } from './useUrlState'

const DEFAULTS = { page: 0, size: 20, status: '', archived: false }

function setup(initialUrl, opts) {
  window.history.replaceState(null, '', initialUrl)   // the hook reads the live URL when writing
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
  return renderHook(() => {
    const [state, setState] = useUrlState(DEFAULTS, opts)
    const location = useLocation()
    // Mirror the router URL into window.location like BrowserRouter would.
    window.history.replaceState(null, '', location.pathname + location.search)
    return { state, setState, location }
  }, { wrapper })
}

const flush = () => act(() => new Promise(r => setTimeout(r, 0)))

describe('useUrlState', () => {
  beforeEach(() => sessionStorage.clear())

  it('reads typed values from the query string, defaults for the rest', () => {
    const { result } = setup('/esign?page=2&status=PENDING&archived=true')
    expect(result.current.state).toEqual({ page: 2, size: 20, status: 'PENDING', archived: true })
  })

  it('writes changes to the URL, leaving defaults out and keeping foreign keys', async () => {
    const { result } = setup('/esign?tab=templates')
    act(() => result.current.setState({ page: 3, status: 'SIGNED' }))
    await flush()
    const params = new URLSearchParams(result.current.location.search)
    expect(params.get('page')).toBe('3')
    expect(params.get('status')).toBe('SIGNED')
    expect(params.get('tab')).toBe('templates')
    expect(params.has('size')).toBe(false)

    act(() => result.current.setState({ page: 0, status: '' }))
    await flush()
    expect(result.current.location.search).toBe('?tab=templates')
  })

  it('namespaces keys with a prefix', async () => {
    const { result } = setup('/esign?b_page=4', { prefix: 'b' })
    expect(result.current.state.page).toBe(4)
    act(() => result.current.setState({ page: 5 }))
    await flush()
    expect(new URLSearchParams(result.current.location.search).get('b_page')).toBe('5')
  })

  it('remembers the list URL so Back links return to it', async () => {
    const { result } = setup('/audit-log')
    act(() => result.current.setState({ page: 1, status: 'FAILED' }))
    await flush()
    expect(listUrl('/audit-log')).toBe('/audit-log?page=1&status=FAILED')
    expect(listUrl('/never-visited')).toBe('/never-visited')
  })
})
