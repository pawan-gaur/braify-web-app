import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { fmtDate } from '../utils/date'
import { getBillingSummary, startCheckout, openBillingPortal } from '../services/api'

const CRUMBS = [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Billing' }]

/* Mirrors SubscriptionPlan (backend) and the public pricing page — keep in sync. */
const PLAN_ROWS = [
  ['Documents / month',  '50',     '500',    'Unlimited'],
  ['Managed storage',    '512 MB', '5 GB',   'Own bucket / unlimited'],
  ['Team members',       '3',      '25',     'Unlimited'],
  ['API calls / month',  '1,000',  '10,000', 'Unlimited'],
  ['Bulk email & bulk e-sign', '—', '✓',     '✓'],
  ['Priority support',   '—',      '—',      '✓'],
]

const STATUS_LABEL = {
  TRIALING: 'Trial', ACTIVE: 'Active', PAST_DUE: 'Payment failed — update your card',
  CANCELED: 'Canceled', TRIAL_ENDED: 'Trial ended', INCOMPLETE: 'Awaiting payment', NONE: '—',
}

/**
 * Plan & billing for the org: current plan / trial, upgrade via Stripe Checkout, manage via
 * the Stripe Customer Portal. Org admins only (Platform Admins manage plans per organisation).
 */
export default function BillingPage() {
  useDocumentTitle('Billing')
  const { user, refreshEntitlements } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [data,     setData]     = useState(null)
  const [error,    setError]    = useState(null)
  const [busy,     setBusy]     = useState(null)   // 'MONTH' | 'YEAR' | 'portal'
  const [billingInterval, setBillingInterval] = useState('MONTH')

  const load = useCallback(() =>
    getBillingSummary().then(d => { setData(d); setError(null); return d }).catch(e => { setError(e.message); return null }), [])

  useEffect(() => { if (user?.role !== ROLES.PLATFORM_ADMIN) load() }, [load, user?.role])

  // Back from Stripe Checkout: the plan updates when Stripe's webhook arrives — poll briefly.
  useEffect(() => {
    const outcome = params.get('checkout')
    if (!outcome) return
    const next = new URLSearchParams(params); next.delete('checkout'); setParams(next, { replace: true })
    if (outcome === 'cancel') { toast.info('Checkout canceled — nothing was charged.'); return }
    toast.success('Payment received — activating Pro…')
    let tries = 0
    const timer = window.setInterval(async () => {
      tries++
      const d = await load()
      if ((d && d.plan === 'PROFESSIONAL' && d.managedBy === 'STRIPE') || tries >= 10) {
        window.clearInterval(timer)
        refreshEntitlements()
      }
    }, 2000)
    return () => window.clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const upgrade = async () => {
    setBusy(billingInterval)
    try { window.location.assign(await startCheckout(billingInterval)) }
    catch (e) { toast.error(e.message); setBusy(null) }
  }

  const manage = async () => {
    setBusy('portal')
    try { window.location.assign(await openBillingPortal()) }
    catch (e) { toast.error(e.message); setBusy(null) }
  }

  if (user?.role === ROLES.PLATFORM_ADMIN) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Breadcrumbs items={CRUMBS} />
        <p className="text-sm text-ink-3 mt-6">Platform Admins manage plans per organisation from{' '}
          <Link to="/organizations" className="text-brand font-semibold">Organizations</Link>.</p>
      </div>
    )
  }

  const plan     = data?.plan || 'FREE'
  const isPro    = plan === 'PROFESSIONAL'
  const isStripe = data?.managedBy === 'STRIPE'
  const isTrial  = data?.managedBy === 'TRIAL'
  const canSubscribe = data?.billingAvailable && !(isStripe && ['ACTIVE', 'PAST_DUE', 'INCOMPLETE'].includes(data?.status)) && plan !== 'ENTERPRISE'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />
      <div className="mt-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Plan & billing</h1>
        <p className="text-sm text-ink-3 mt-1">Your workspace’s plan, trial and payment details.</p>
      </div>

      {error && <div className="alert-error border rounded-xl px-4 py-3 text-sm mb-6">{error}</div>}

      {/* Current plan */}
      <div className="card p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider">Current plan</p>
          <p className="text-2xl font-extrabold text-ink dark:text-white mt-1">
            {data ? data.planLabel : '…'}
            {isTrial && <span className="badge badge-brand ml-2 align-middle">Trial</span>}
          </p>
          <p className="text-sm text-ink-3 mt-1">
            {!data ? '' : isTrial
              ? `Trial ends ${fmtDate(data.trialEndsAt)} (${data.trialDaysLeft} day${data.trialDaysLeft === 1 ? '' : 's'} left), then Free.`
              : isStripe
                ? `${STATUS_LABEL[data.status] || data.status}${data.currentPeriodEnd ? ` · ${data.cancelAtPeriodEnd ? 'ends' : 'renews'} ${fmtDate(data.currentPeriodEnd)}` : ''}${data.interval ? ` · billed ${data.interval === 'YEAR' ? 'yearly' : 'monthly'}` : ''}`
                : plan === 'FREE' ? 'Free forever — upgrade any time.' : 'Managed by the Braify team.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {data?.hasBillingAccount && data?.billingAvailable && (
            <button onClick={manage} disabled={!!busy} className="btn btn-secondary">
              {busy === 'portal' ? 'Opening…' : 'Manage billing & invoices'}
            </button>
          )}
          <Link to="/usage" className="btn btn-ghost">View usage</Link>
        </div>
      </div>

      {isStripe && data?.status === 'PAST_DUE' && (
        <div className="alert-error border rounded-xl px-4 py-3 text-sm mb-6">
          Your last payment failed. Update your card in <button onClick={manage} className="font-semibold underline">Manage billing</button> to keep Pro.
        </div>
      )}

      {/* Plans */}
      <div className="card overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center justify-between gap-3 flex-wrap border-b border-ink-8 dark:border-gray-700">
          <h2 className="text-[15px] font-bold text-ink dark:text-white">Compare plans</h2>
          {data?.yearlyAvailable && (
            <div className="flex gap-1 p-1 bg-ink-8 dark:bg-gray-800 rounded-lg" role="group" aria-label="Billing interval">
              {[['MONTH', 'Monthly'], ['YEAR', 'Yearly · 2 months free']].map(([k, l]) => (
                <button key={k} onClick={() => setBillingInterval(k)} aria-pressed={billingInterval === k}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${billingInterval === k ? 'bg-white dark:bg-gray-700 text-ink dark:text-white shadow-soft' : 'text-ink-3'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-4 font-semibold text-ink-3 w-1/4"> </th>
                {[['Free', '$0', plan === 'FREE'],
                  ['Pro', `${billingInterval === 'YEAR' ? data?.proYearlyPrice ?? '$290' : data?.proMonthlyPrice ?? '$29'}${billingInterval === 'YEAR' ? '/yr' : '/mo'}`, isPro],
                  ['Enterprise', 'Custom', plan === 'ENTERPRISE']].map(([n, p, current]) => (
                  <th key={n} className={`p-4 align-top ${current ? 'bg-brand-50/60 dark:bg-brand/10' : ''}`}>
                    <p className="font-bold text-ink dark:text-white">{n} {current && <span className="badge badge-success ml-1">Current</span>}</p>
                    <p className="text-lg font-extrabold text-ink dark:text-white mt-1">{p}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map(([label, ...vals]) => (
                <tr key={label} className="border-t border-ink-8 dark:border-gray-700">
                  <td className="p-4 text-ink-3">{label}</td>
                  {vals.map((v, i) => <td key={i} className="p-4 text-ink-2 dark:text-gray-300">{v}</td>)}
                </tr>
              ))}
              <tr className="border-t border-ink-8 dark:border-gray-700">
                <td className="p-4" />
                <td className="p-4" />
                <td className="p-4">
                  {canSubscribe && (!isPro || isTrial)
                    ? <button onClick={upgrade} disabled={!!busy} className="btn btn-primary btn-sm">
                        {busy === billingInterval ? 'Redirecting…' : isTrial ? 'Subscribe to Pro' : 'Upgrade to Pro'}
                      </button>
                    : !data?.billingAvailable && plan !== 'PROFESSIONAL'
                      ? <Link to="/contact-sales" className="btn btn-secondary btn-sm">Contact us to upgrade</Link>
                      : null}
                </td>
                <td className="p-4"><Link to="/contact-sales" className="btn btn-secondary btn-sm">Contact sales</Link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-ink-4 mt-3">Payments are processed securely by Stripe. Cancel any time from Manage billing — you keep Pro until the end of the paid period.</p>
    </div>
  )
}
