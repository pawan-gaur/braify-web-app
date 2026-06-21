import { useState, useEffect, useCallback } from 'react'
import { getOnboardingRequests, reviewOnboardingRequest, getPendingOnboardingCount } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import { ALL_FEATURES, FEATURE_META } from '../config/features'
import { IconCheck, IconX } from '../components/ui/icons'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Onboarding Requests' },
]

const STATUS_TABS = [
  { label: 'All',           value: null },
  { label: 'Pending',       value: 'PENDING' },
  { label: 'Approved',      value: 'APPROVED' },
  { label: 'Rejected',      value: 'REJECTED' },
  { label: 'Info Required', value: 'INFO_REQUIRED' },
]

const STATUS_STYLE = {
  PENDING:      { bg: 'bg-amber-100  dark:bg-amber-900/30',  text: 'text-amber-700  dark:text-amber-300',  dot: 'bg-amber-500',  label: 'Pending' },
  APPROVED:     { bg: 'bg-green-100  dark:bg-green-900/30',  text: 'text-green-700  dark:text-green-300',  dot: 'bg-green-500',  label: 'Approved' },
  REJECTED:     { bg: 'bg-red-100    dark:bg-red-900/30',    text: 'text-red-700    dark:text-red-300',    dot: 'bg-red-500',    label: 'Rejected' },
  INFO_REQUIRED:{ bg: 'bg-blue-100   dark:bg-blue-900/30',   text: 'text-blue-700   dark:text-blue-300',   dot: 'bg-blue-500',   label: 'Info Required' },
}

import { fmtDate } from '../utils/date'

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function FeaturePill({ featureKey }) {
  const meta = FEATURE_META[featureKey]
  if (!meta) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
      {featureKey}
    </span>
  )
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color }}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon}/>
      </svg>
      {meta.label}
    </span>
  )
}

/* ── Review Modal ──────────────────────────────────────────────────────────── */
function ReviewModal({ request, onClose, onDone }) {
  const toast = useToast()
  const [action,           setAction]           = useState('APPROVE')
  const [note,             setNote]             = useState('')
  const [approvedFeatures, setApprovedFeatures] = useState(request.requestedFeatures ?? [])
  const [saving,           setSaving]           = useState(false)

  function toggleFeature(key) {
    setApprovedFeatures(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSubmit() {
    if (action === 'APPROVE' && approvedFeatures.length === 0) {
      toast.error('Select at least one feature to approve.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        action,
        note: note.trim() || null,
        ...(action === 'APPROVE' ? { approvedFeatures } : {}),
      }
      await reviewOnboardingRequest(request.id, payload)
      toast.success(
        action === 'APPROVE'      ? 'Request approved — org and user created.' :
        action === 'REJECT'       ? 'Request rejected.' :
                                    'Information request sent to applicant.'
      )
      onDone()
    } catch (err) {
      toast.error(err.message || 'Review failed.')
    } finally {
      setSaving(false)
    }
  }

  const actionBtnStyle = {
    APPROVE:      'bg-green-600  hover:bg-green-700  text-white',
    REJECT:       'bg-red-600    hover:bg-red-700    text-white',
    INFO_REQUIRED:'bg-blue-600   hover:bg-blue-700   text-white',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-auto flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review Request</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {request.organizationName} — {request.applicantName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Applicant Details */}
          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Applicant Name</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{request.applicantName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{request.applicantEmail}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Organization</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{request.organizationName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Submitted</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{fmtDate(request.submittedAt)}</p>
            </div>
            {request.address && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{request.address}</p>
              </div>
            )}
            {(request.state || request.region || request.country) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Location</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {[request.state, request.region, request.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
            {request.description && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{request.description}</p>
              </div>
            )}
          </div>

          {/* Requested Features */}
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Requested Features
            </p>
            <div className="flex flex-wrap gap-2">
              {(request.requestedFeatures ?? []).length === 0
                ? <span className="text-sm text-gray-400">No features requested</span>
                : (request.requestedFeatures ?? []).map(f => <FeaturePill key={f} featureKey={f} />)
              }
            </div>
          </div>

          {/* Previous Review Note (if any) */}
          {request.reviewNote && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Previous Note</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{request.reviewNote}</p>
            </div>
          )}

          {/* ── Action selection ── */}
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Action</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'APPROVE',       label: 'Approve',          icon: 'check', style: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300', inactive: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400' },
                { value: 'REJECT',        label: 'Reject',           icon: 'x', style: 'border-red-500   bg-red-50   text-red-700   dark:bg-red-900/20   dark:text-red-300',   inactive: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-400' },
                { value: 'INFO_REQUIRED', label: 'Request Info',     icon: '?', style: 'border-blue-500  bg-blue-50  text-blue-700  dark:bg-blue-900/20  dark:text-blue-300',  inactive: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-semibold text-sm transition-all
                    ${action === opt.value ? opt.style : opt.inactive}`}
                >
                  <span className="text-xl">
                    {opt.icon === 'check' ? <IconCheck className="w-5 h-5" />
                      : opt.icon === 'x' ? <IconX className="w-5 h-5" />
                      : opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature checkboxes (only for APPROVE) */}
          {action === 'APPROVE' && (
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Features to Grant
                <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">(adjust as needed)</span>
              </p>
              <div className="space-y-2">
                {ALL_FEATURES.map(feat => {
                  const checked = approvedFeatures.includes(feat.key)
                  return (
                    <label
                      key={feat.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${checked
                          ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(feat.key)}
                        className="w-4 h-4 rounded accent-brand shrink-0"
                      />
                      <div className="w-5 h-5 shrink-0" style={{ color: feat.color }}>
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={feat.icon}/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{feat.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{feat.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              Note
              {action === 'REJECT' && <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">(sent to applicant)</span>}
              {action === 'INFO_REQUIRED' && <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">(sent to applicant)</span>}
              {action === 'APPROVE' && <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">(internal, optional)</span>}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={
                action === 'REJECT'        ? 'Reason for rejection (optional but recommended)…' :
                action === 'INFO_REQUIRED' ? 'What additional information is needed?…' :
                                             'Internal note (optional)…'
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300
                       hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${actionBtnStyle[action]}`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Submitting…
              </span>
            ) : (
              action === 'APPROVE'       ? 'Approve & Create Org' :
              action === 'REJECT'        ? 'Reject Request' :
                                           'Send Info Request'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function OnboardingRequestsPage() {
  useDocumentTitle('Onboarding Requests')
  const toast = useToast()

  const [requests,    setRequests]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState(null)   // null = All
  const [reviewing,   setReviewing]   = useState(null)   // request being reviewed
  const [pendingCount,setPendingCount] = useState(0)
  const [view, setView] = useView('braify-onboarding-requests-view')

  const load = useCallback(async (statusFilter) => {
    setLoading(true)
    try {
      const data = await getOnboardingRequests(statusFilter)
      setRequests(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load(activeTab)
  }, [activeTab, load])

  useEffect(() => {
    getPendingOnboardingCount()
      .then(d => setPendingCount(d.count ?? 0))
      .catch(() => {})
  }, [requests])

  function handleTabChange(val) {
    setActiveTab(val)
  }

  function handleDone() {
    setReviewing(null)
    load(activeTab)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2">
            Onboarding Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                               rounded-full text-[11px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-ink-3 dark:text-gray-400 mt-1">
            Review and approve organizations requesting access to the platform.
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-8 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
              ${activeTab === tab.value
                ? 'bg-gradient-accent text-white shadow-soft'
                : 'text-ink-3 dark:text-gray-400 hover:text-ink dark:hover:text-gray-200'
              }`}
          >
            {tab.label}
            {tab.value === 'PENDING' && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                               rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink dark:text-white mb-1">No requests found</h3>
          <p className="text-sm text-ink-3 dark:text-gray-400">
            {activeTab ? `No ${STATUS_STYLE[activeTab]?.label ?? activeTab} requests at the moment.` : 'No onboarding requests have been submitted yet.'}
          </p>
        </div>
      ) : view === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(req => (
            <div key={req.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}>
                  {req.organizationName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink dark:text-white truncate">{req.organizationName}</p>
                  {req.country && (
                    <p className="text-[11px] text-ink-4 mt-0.5">
                      {[req.state, req.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="text-xs text-ink-2 dark:text-gray-400">
                <p className="font-medium text-ink dark:text-gray-200">{req.applicantName}</p>
                <p className="truncate">{req.applicantEmail}</p>
              </div>

              {(req.requestedFeatures ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {req.requestedFeatures.map(f => <FeaturePill key={f} featureKey={f} />)}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 mt-auto">
                <p className="text-[11px] text-ink-4">{fmtDate(req.submittedAt)}</p>
                {(req.status === 'PENDING' || req.status === 'INFO_REQUIRED') ? (
                  <button
                    onClick={() => setReviewing(req)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:shadow-md active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}
                  >
                    Review
                  </button>
                ) : req.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold"><IconCheck className="w-3.5 h-3.5" />Done</span>
                ) : req.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-semibold"><IconX className="w-3.5 h-3.5" />Closed</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-7 dark:border-gray-700 bg-ink-8 dark:bg-gray-900/40">
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Organization
                </th>
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Applicant
                </th>
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Requested Features
                </th>
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Submitted
                </th>
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Status
                </th>
                <th className="text-left text-[11px] font-bold text-ink-3 dark:text-gray-400 uppercase tracking-wide px-5 py-3">
                  Reviewed By
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-ink-8 dark:hover:bg-gray-700/30 transition-colors">
                  {/* Organization */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}>
                        {req.organizationName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-ink dark:text-white leading-tight">
                          {req.organizationName}
                        </p>
                        {req.country && (
                          <p className="text-[11px] text-ink-4 mt-0.5">
                            {[req.state, req.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Applicant */}
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink dark:text-gray-200 leading-tight">{req.applicantName}</p>
                    <p className="text-[11px] text-ink-4 mt-0.5">{req.applicantEmail}</p>
                  </td>

                  {/* Requested Features */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(req.requestedFeatures ?? []).length === 0
                        ? <span className="text-[11px] text-gray-400">—</span>
                        : (req.requestedFeatures ?? []).map(f => <FeaturePill key={f} featureKey={f} />)
                      }
                    </div>
                    {/* Show approved features if approved */}
                    {req.status === 'APPROVED' && req.approvedFeatures && req.approvedFeatures.length > 0 && (
                      <div className="mt-1.5">
                        <p className="text-[10px] text-gray-400 mb-1">Granted:</p>
                        <div className="flex flex-wrap gap-1">
                          {req.approvedFeatures.map(f => <FeaturePill key={f} featureKey={f} />)}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Submitted */}
                  <td className="px-5 py-4 text-ink-3 dark:text-gray-400 whitespace-nowrap">
                    {fmtDate(req.submittedAt)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={req.status} />
                    {req.reviewedAt && (
                      <p className="text-[10px] text-ink-4 mt-1">{fmtDate(req.reviewedAt)}</p>
                    )}
                  </td>

                  {/* Reviewed By */}
                  <td className="px-5 py-4 text-ink-3 dark:text-gray-400 text-[12px]">
                    {req.reviewedBy || '—'}
                    {req.reviewNote && (
                      <p className="text-[10px] text-ink-4 mt-0.5 max-w-[140px] truncate" title={req.reviewNote}>
                        {req.reviewNote}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {req.status === 'PENDING' || req.status === 'INFO_REQUIRED' ? (
                      <button
                        onClick={() => setReviewing(req)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all
                                   hover:shadow-md active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#2F5BF0,#6D52E8)' }}
                      >
                        Review
                      </button>
                    ) : req.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold"><IconCheck className="w-3.5 h-3.5" />Done</span>
                    ) : req.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-semibold"><IconX className="w-3.5 h-3.5" />Closed</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <ReviewModal
          request={reviewing}
          onClose={() => setReviewing(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
