import { useState, useEffect } from 'react'
import {
  searchOrganizations,
  shareTemplate,
  revokeShare,
  getSharesForTemplate,
} from '../../services/api'
import { useToast } from '../../context/ToastContext'

const PERMISSIONS = [
  {
    value: 'VIEW',
    label: 'View only',
    desc: 'Target org can preview the template but cannot generate PDFs with it.',
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  },
  {
    value: 'USE',
    label: 'Use',
    desc: 'Target org can generate PDFs / send emails using this template.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'EDIT',
    label: 'Edit (fork)',
    desc: 'A copy is created in the target org. They can modify it independently.',
    color: 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300',
  },
]

/**
 * Modal for sharing a template with another organisation.
 *
 * @param {string}   templateId    - ID of the template to share
 * @param {string}   templateType  - 'TEMPLATE' | 'EMAIL_TEMPLATE'
 * @param {string}   templateName  - display name
 * @param {Function} onClose       - called to close the modal
 */
export default function ShareTemplateModal({ templateId, templateType, templateName, onClose }) {
  const toast = useToast()

  // Org search
  const [orgQuery,      setOrgQuery]      = useState('')
  const [orgResults,    setOrgResults]    = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedOrg,   setSelectedOrg]   = useState(null)

  // Form
  const [permission, setPermission] = useState('USE')
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)

  // Existing shares
  const [shares,        setShares]        = useState([])
  const [sharesLoading, setSharesLoading] = useState(true)
  const [revokingId,    setRevokingId]    = useState(null)

  // Load existing shares
  useEffect(() => {
    getSharesForTemplate(templateId)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setSharesLoading(false))
  }, [templateId])

  // Debounced org search
  useEffect(() => {
    if (!orgQuery.trim()) { setOrgResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const data = await searchOrganizations(orgQuery)
        setOrgResults(data.filter(o => o.active))
      } catch {
        setOrgResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [orgQuery])

  const handleShare = async () => {
    if (!selectedOrg) { toast.error('Please select a target organisation.'); return }
    setSaving(true)
    try {
      const created = await shareTemplate({
        templateId,
        templateType,
        targetOrgId: selectedOrg.id,
        permission,
        note: note.trim() || null,
      })
      toast.success(`Template shared with ${selectedOrg.name}.`)
      setShares(prev => [created, ...prev])
      setSelectedOrg(null)
      setOrgQuery('')
      setNote('')
    } catch (err) {
      toast.error(err.message || 'Failed to share template.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (share) => {
    if (!confirm(`Revoke share with "${share.targetOrgName}"? ${share.permission === 'EDIT' ? 'The forked copy will be soft-deleted.' : ''}`)) return
    setRevokingId(share.id)
    try {
      await revokeShare(share.id)
      toast.success('Share revoked.')
      setShares(prev => prev.filter(s => s.id !== share.id))
    } catch (err) {
      toast.error(err.message || 'Failed to revoke share.')
    } finally {
      setRevokingId(null)
    }
  }

  const permMeta = (p) => PERMISSIONS.find(x => x.value === p)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Share Template</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[340px]">{templateName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Org search */}
          <div>
            <label className="form-label">Target Organisation</label>
            {selectedOrg ? (
              <div className="flex items-center justify-between mt-1 px-3 py-2.5 rounded-xl
                              border-2 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
                <div>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{selectedOrg.name}</p>
                  <p className="text-xs text-indigo-400">{selectedOrg.code}</p>
                </div>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative mt-1">
                <input
                  type="text"
                  className="form-input pl-9"
                  placeholder="Search organisation by name…"
                  value={orgQuery}
                  onChange={e => setOrgQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                {/* Dropdown */}
                {(orgResults.length > 0 || searchLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800
                                  border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10
                                  max-h-48 overflow-y-auto">
                    {searchLoading && (
                      <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                        <svg className="animate-spin w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Searching…
                      </div>
                    )}
                    {orgResults.map(org => (
                      <button
                        key={org.id}
                        onClick={() => { setSelectedOrg(org); setOrgQuery(''); setOrgResults([]) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50
                                   border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{org.name}</p>
                        <p className="text-xs text-gray-400">{org.code}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permission */}
          <div>
            <label className="form-label">Permission level</label>
            <div className="space-y-2 mt-1">
              {PERMISSIONS.map(p => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${permission === p.value ? p.color : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name="permission"
                    value={p.value}
                    checked={permission === p.value}
                    onChange={() => setPermission(p.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="form-label">
              Note <span className="text-gray-400 font-normal text-[11px]">(optional · max 300 chars)</span>
            </label>
            <textarea
              className="form-input resize-none mt-1"
              rows={2}
              maxLength={300}
              placeholder="Reason for sharing, context for the recipient…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <p className="text-[10px] text-gray-400 text-right mt-0.5">{note.length}/300</p>
          </div>

          {/* Existing shares */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Active shares</h3>
            {sharesLoading ? (
              <div className="text-xs text-gray-400 py-3 text-center">Loading…</div>
            ) : shares.length === 0 ? (
              <div className="text-xs text-gray-400 py-3 text-center italic">
                This template hasn't been shared yet.
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map(share => {
                  const meta = permMeta(share.permission)
                  return (
                    <div key={share.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl
                                 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {share.targetOrgName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta?.color}`}>
                            {meta?.label}
                          </span>
                          {share.note && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[160px]" title={share.note}>
                              "{share.note}"
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevoke(share)}
                        disabled={revokingId === share.id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0 ml-3"
                      >
                        {revokingId === share.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Close
          </button>
          <button
            onClick={handleShare}
            disabled={saving || !selectedOrg}
            className="btn btn-primary flex-1"
          >
            {saving ? 'Sharing…' : 'Share Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
