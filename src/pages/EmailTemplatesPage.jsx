import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmailTemplates, deleteEmailTemplate, sendEmailTemplate } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import VersionHistoryModal from '../components/ui/VersionHistoryModal'
import EmailPreviewModal from '../components/ui/EmailPreviewModal'

const CRUMBS = [
  { label: 'Dashboard',       to: '/' },
  { label: 'Email Templates' },
]

export default function EmailTemplatesPage() {
  useDocumentTitle('Email Templates')
  const navigate = useNavigate()
  const { can }  = useAuth()
  const toast    = useToast()

  const [templates,       setTemplates]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [versionTemplate, setVersionTemplate] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [sendTemplate,    setSendTemplate]    = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getEmailTemplates()
      .then(setTemplates)
      .catch(err => toast.error(err.message || 'Could not load email templates.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete email template "${name}"?`)) return
    await deleteEmailTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
            {/* Mail icon */}
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Email Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/email-builder')}>
          + New Email Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading email templates…
        </div>
      ) : templates.length === 0 ? (
        <EmptyState onNew={() => navigate('/email-builder')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map(t => (
            <EmailTemplateCard
              key={t.id}
              template={t}
              onEdit={() => navigate(`/email-builder/${t.id}`)}
              onDelete={can('delete') ? () => handleDelete(t.id, t.name) : null}
              onVersions={() => setVersionTemplate(t)}
              onPreview={() => setPreviewTemplate(t)}
              onSend={() => setSendTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Version history modal */}
      {versionTemplate && (
        <VersionHistoryModal
          template={versionTemplate}
          kind="email"
          onClose={() => setVersionTemplate(null)}
          onRestored={() => { setVersionTemplate(null); load() }}
        />
      )}

      {/* Email preview modal */}
      {previewTemplate && (
        <EmailPreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Send email modal */}
      {sendTemplate && (
        <SendEmailModal
          template={sendTemplate}
          onClose={() => setSendTemplate(null)}
        />
      )}
    </div>
  )
}

/* ── Email Template Card ─────────────────────────────────────────────────── */
function EmailTemplateCard({ template, onEdit, onDelete = null, onVersions, onPreview, onSend }) {
  const date = template.updatedAt
    ? new Date(template.updatedAt).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card hover:shadow-card-hover
                    transition-shadow duration-200 flex flex-col overflow-hidden
                    border border-gray-100 dark:border-gray-700">

      {/* ── Clickable preview thumbnail ── */}
      <button
        onClick={onPreview}
        className="group relative h-28 w-full overflow-hidden bg-gradient-to-br
                   from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40
                   flex items-center justify-center focus:outline-none"
        title="Preview email"
      >
        {/* Faint envelope icon */}
        <svg className="w-14 h-14 text-sky-100 dark:text-sky-900/60 transition-transform
                        duration-200 group-hover:scale-110"
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9
                   2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-sky-600/0 group-hover:bg-sky-600/10
                        transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-md
                           text-sky-600 dark:text-sky-400 text-xs font-bold
                           px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Preview
          </span>
        </div>

        {/* Gradient bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-6
                        bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
      </button>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title + type badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
                     a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <h3 className="font-bold text-navy dark:text-gray-100 truncate text-base leading-snug">
                {template.name}
              </h3>
            </div>
            {template.subject && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Subject: <span className="font-medium">{template.subject}</span>
              </p>
            )}
            {template.fromName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                From: {template.fromName}
              </p>
            )}
          </div>
          <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 shrink-0 text-[10px]">
            Email
          </span>
        </div>

        {/* Placeholder chips */}
        {template.placeholders?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.placeholders.slice(0, 3).map(p => (
              <span key={p} className="ph-chip">{`{{${p}}}`}</span>
            ))}
            {template.placeholders.length > 3 && (
              <span className="text-xs text-gray-400 self-center">
                +{template.placeholders.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-auto pt-2
                        border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-300 dark:text-gray-500">Updated {date}</p>
          {template.currentVersion > 0 && (
            <button
              onClick={onVersions}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                         bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400
                         hover:bg-indigo-100 transition-colors flex items-center gap-1"
              title="View version history"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              v{template.currentVersion}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={onEdit}>
            Edit Template
          </button>
          {/* Send */}
          <button
            className="btn btn-ghost btn-sm px-2 text-emerald-500 hover:bg-emerald-50
                       hover:text-emerald-600 dark:hover:bg-emerald-900/20"
            onClick={onSend}
            title="Send email"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
          {/* Preview */}
          <button className="btn btn-ghost btn-sm px-2 text-sky-500 hover:bg-sky-50
                             hover:text-sky-600 dark:hover:bg-sky-900/20"
            onClick={onPreview} title="Preview email">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                   -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          {/* Versions */}
          <button className="btn btn-ghost btn-sm px-2" onClick={onVersions} title="Version history">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581
                   m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          {/* Delete — hidden for USER role */}
          {onDelete && (
            <button className="btn btn-ghost btn-sm px-2 text-red-400 hover:bg-red-50 hover:text-red-600"
              onClick={onDelete} title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                     m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Send Email Modal ────────────────────────────────────────────────────── */
function SendEmailModal({ template, onClose }) {
  const toast = useToast()
  const [to,           setTo]           = useState('')
  const [subject,      setSubject]      = useState(template.subject || '')
  const [placeholders, setPlaceholders] = useState(
    Object.fromEntries((template.placeholders || []).map(p => [p, '']))
  )
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSend = async () => {
    if (!to.trim()) { toast.error('Recipient email is required'); return }
    setSending(true)
    try {
      await sendEmailTemplate(template.id, {
        to: to.trim(),
        subject: subject.trim() || undefined,
        placeholders,
      })
      setSent(true)
      toast.success(`Email sent to ${to.trim()}`)
      setTimeout(onClose, 1500)
    } catch (err) {
      toast.error(err.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const setPlaceholder = (key, val) =>
    setPlaceholders(prev => ({ ...prev, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md
                      border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Send Email</h2>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{template.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              To <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input w-full"
              placeholder="recipient@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              disabled={sending || sent}
              autoFocus
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Subject
              <span className="ml-1 font-normal text-gray-400">(leave blank to use template default)</span>
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder={template.subject || 'Email subject…'}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending || sent}
            />
          </div>

          {/* Placeholder values */}
          {template.placeholders?.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Placeholder Values
              </label>
              <div className="space-y-2.5">
                {template.placeholders.map(key => (
                  <div key={key}>
                    <label className="block text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 font-mono">
                      {`{{${key}}}`}
                    </label>
                    <input
                      type="text"
                      className="input w-full text-sm"
                      placeholder={`Value for ${key}…`}
                      value={placeholders[key] || ''}
                      onChange={e => setPlaceholder(key, e.target.value)}
                      disabled={sending || sent}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success state */}
          {sent && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20
                            text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={handleSend}
            disabled={sending || sent || !to.trim()}
          >
            {sending ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #eef2ff 100%)' }}>
        <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No email templates yet</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">
        Design beautiful, responsive email templates with the drag-and-drop builder.
      </p>
      <button className="btn btn-primary" onClick={onNew}>Create Email Template</button>
    </div>
  )
}
