import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import EmptyState from '../components/ui/EmptyState'
import SignerDocumentRow, { useSignerDocActions } from '../components/signer/SignerDocumentRow'
import VerifyEmailCard from '../components/signer/VerifyEmailCard'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { signerListDocuments, needsEmailVerification } from '../services/api'

const CRUMBS = [{ label: 'Dashboard' }]
const PREVIEW = 5

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* Count tiles — each opens the matching My signatures tab. */
const TILES = [
  { key: 'ACTION',   label: 'Needs your signature', tone: 'text-brand',   to: '/my-documents' },
  { key: 'UPCOMING', label: 'Waiting on others',    tone: 'text-amber-600', to: '/my-documents?tab=UPCOMING' },
  { key: 'SIGNED',   label: 'Signed',               tone: 'text-emerald-600', to: '/my-documents?tab=SIGNED' },
  { key: 'OTHER',    label: 'Expired, cancelled & CC', tone: 'text-ink-3', to: '/my-documents?tab=OTHER' },
]

/**
 * Dashboard for signer-portal sessions (external recipients without a Braify account).
 * Only uses the signer endpoints — a signer session cannot call the org dashboard APIs.
 */
export default function SignerDashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [action,  setAction]  = useState(null)   // ACTION page (also carries all counts)
  const [signed,  setSigned]  = useState(null)
  const [error,   setError]   = useState(null)
  const [mustVerify, setMustVerify] = useState(false)

  const load = useCallback(() => {
    setError(null)
    Promise.all([
      signerListDocuments({ tab: 'ACTION', size: PREVIEW }),
      signerListDocuments({ tab: 'SIGNED', size: PREVIEW }),
    ])
      .then(([a, s]) => { setAction(a); setSigned(s); setMustVerify(false) })
      .catch(e => needsEmailVerification(e) ? setMustVerify(true) : setError(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  const { busyId, sign, view, download } = useSignerDocActions(load)

  const counts  = action?.counts || {}
  const pending = counts.ACTION ?? 0
  const name    = user?.firstName || user?.email?.split('@')[0]
  const date    = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  const row = (doc) => (
    <SignerDocumentRow key={doc.id} doc={doc} busy={busyId === doc.id}
      onSign={() => sign(doc)} onView={() => view(doc)} onDownload={() => download(doc)} />
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="mt-4 mb-8">
        <h1 className="display-2 text-ink dark:text-white font-extrabold">
          {greeting()}, <span className="text-gradient">{name}</span>
        </h1>
        <p className="text-sm text-ink-3 mt-1.5">
          {date} · {mustVerify ? 'Confirm your email to see your documents' : action == null ? '…'
            : pending ? `${pending} ${pending === 1 ? 'document needs' : 'documents need'} your signature`
            : 'You’re all caught up'}
        </p>
      </div>

      {mustVerify ? (
        <VerifyEmailCard email={user?.email} onVerified={load} />
      ) : (<>
      {error && (
        <div className="alert-error border rounded-xl px-4 py-3 mb-6 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={load} className="font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {TILES.map(t => (
          <Link key={t.key} to={t.to} className="card card-hover p-4 block">
            <p className={`text-3xl font-extrabold ${t.tone}`}>{action == null ? '–' : (counts[t.key] ?? 0)}</p>
            <p className="text-sm text-ink-3 mt-1">{t.label}</p>
          </Link>
        ))}
      </div>

      {/* Needs your signature */}
      <Section title="Needs your signature" count={pending} to="/my-documents">
        {action == null ? <Skeleton />
          : action.items.length === 0
            ? <div className="card"><EmptyState variant="success" size="compact" title="You’re all caught up"
                description="No documents are waiting for your signature right now." /></div>
            : <ul className="space-y-3">{action.items.map(row)}</ul>}
      </Section>

      {/* Recently signed */}
      <Section title="Recently signed" count={counts.SIGNED ?? 0} to="/my-documents?tab=SIGNED">
        {signed == null ? <Skeleton />
          : signed.items.length === 0
            ? <div className="card"><EmptyState variant="documents" size="compact" title="No signed documents yet"
                description="Documents you sign appear here, with the final copy once everyone has signed."
                secondaryAction={pending ? { label: 'Sign your first document', onClick: () => navigate('/my-documents') } : undefined} /></div>
            : <ul className="space-y-3">{signed.items.map(row)}</ul>}
      </Section>
      </>)}
    </div>
  )
}

function Section({ title, count, to, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-ink dark:text-white">{title}</h2>
        {count > PREVIEW && (
          <Link to={to} className="text-sm font-semibold text-brand hover:text-brand-hover">View all {count} →</Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map(i => <div key={i} className="skeleton h-24 rounded-card" />)}
    </div>
  )
}
