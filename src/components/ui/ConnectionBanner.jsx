import { useNetworkStatus } from '../../context/NetworkStatusContext'

/**
 * Global connectivity banner, fixed to the top of the viewport.
 *   • No network (browser offline) → amber "No network found".
 *   • Backend unreachable          → red "Server is down" + Retry.
 *   • Everything OK                → renders nothing.
 */
export default function ConnectionBanner() {
  const { status, retry } = useNetworkStatus()

  if (status === 'online') return null

  const offline = status === 'offline'

  const cfg = offline
    ? {
        bg: 'bg-amber-500',
        icon: 'M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m9.9 9.9a5 5 0 010-7.072m-7.07 7.072a5 5 0 010-7.072M12 12h.01',
        title: 'No network found',
        detail: 'Check your internet connection — we’ll reconnect automatically.',
      }
    : {
        bg: 'bg-red-600',
        icon: 'M18.364 5.636L5.636 18.364M12 3v0m0 18v0M5.05 8a10 10 0 0113.9 0M2 12a14 14 0 0120 0',
        title: 'Server is down',
        detail: 'We can’t reach Braify right now. Retrying…',
      }

  return (
    <div
      role="alert"
      className={`fixed top-0 inset-x-0 z-[100] ${cfg.bg} text-white shadow-md`}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
        </svg>
        <span className="font-semibold">{cfg.title}</span>
        <span className="hidden sm:inline opacity-90">— {cfg.detail}</span>
        {!offline && (
          <button
            type="button"
            onClick={retry}
            className="ml-1 rounded-md bg-white/20 hover:bg-white/30 px-2.5 py-0.5 text-xs font-semibold transition-colors"
          >
            Retry now
          </button>
        )}
      </div>
    </div>
  )
}
