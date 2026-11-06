import { useState } from 'react'

const dismissKey = (orgId) => `braify.gettingStarted.dismissed.${orgId || 'none'}`

function readDismissed(orgId) {
  try { return localStorage.getItem(dismissKey(orgId)) === '1' } catch { return false }
}

/**
 * First-run checklist for a new workspace. Steps tick themselves off from the dashboard
 * stats, so it reflects real progress; hidden once everything is done or the user dismisses it.
 *
 * @param stats      dashboard stats (esignTotal, totalPdfTemplates, totalFiles, totalUsers)
 * @param can        { pdf, email, esign, files } — feature access, hides steps the org can't use
 * @param isOrgAdmin shows the "invite a teammate" step
 * @param welcome    true right after sign-up (shows a welcome line)
 */
export default function GettingStartedChecklist({ stats, can, isOrgAdmin, orgId, welcome, onNavigate }) {
  const [dismissed, setDismissed] = useState(() => readDismissed(orgId))
  if (!stats || dismissed) return null

  const steps = [
    can.esign && {
      key: 'esign', title: 'Send a document for signature',
      body: 'Upload a PDF, drop in signature fields and email it to your signer.',
      done: (stats.esignTotal ?? 0) > 0, to: '/esign/new', cta: 'Send for signature',
    },
    can.pdf && {
      key: 'pdf', title: 'Create a PDF template',
      body: 'Start from a ready-made template — invoices, offer letters, certificates.',
      done: (stats.totalPdfTemplates ?? 0) > 0, to: '/templates', cta: 'Browse templates',
    },
    can.files && {
      key: 'files', title: 'Upload a file',
      body: 'Keep contracts and supporting documents in one secure place.',
      done: (stats.totalFiles ?? 0) > 0, to: '/files', cta: 'Upload a file',
    },
    isOrgAdmin && {
      key: 'team', title: 'Invite a teammate',
      body: 'Bring your team in so they can send and track documents too.',
      done: (stats.totalUsers ?? 0) > 1, to: '/users', cta: 'Invite',
    },
  ].filter(Boolean)

  const doneCount = steps.filter(s => s.done).length
  if (steps.length === 0 || doneCount === steps.length) return null

  const dismiss = () => {
    try { localStorage.setItem(dismissKey(orgId), '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div className="dash-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-ink dark:text-white">
            {welcome ? 'Welcome to Braify — let’s get you set up' : 'Get started'}
          </h2>
          <p className="text-xs text-ink-3 mt-0.5">{doneCount} of {steps.length} done</p>
        </div>
        <button onClick={dismiss} className="text-xs font-semibold text-ink-4 hover:text-ink-2" aria-label="Dismiss getting started checklist">
          Dismiss
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-ink-8 dark:bg-gray-700 mb-4 overflow-hidden">
        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map(s => (
          <li key={s.key} className={`rounded-xl border p-4 flex gap-3 ${s.done
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/10'
            : 'border-ink-7 dark:border-gray-700'}`}>
            <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${s.done
              ? 'bg-emerald-500 text-white' : 'bg-ink-8 text-ink-3 dark:bg-gray-700'}`} aria-hidden="true">
              {s.done ? '✓' : ''}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${s.done ? 'text-ink-3 line-through' : 'text-ink dark:text-white'}`}>{s.title}</p>
              {!s.done && (
                <>
                  <p className="text-xs text-ink-3 mt-0.5">{s.body}</p>
                  <button onClick={() => onNavigate(s.to)} className="btn btn-primary btn-sm mt-3">{s.cta}</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
