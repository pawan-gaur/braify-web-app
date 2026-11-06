import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { esignSaveAsTemplate } from '../../services/api'
import { useToast } from '../../context/ToastContext'

/**
 * Saves a document's PDF + field layout as a reusable e-sign template. Each signatory becomes a
 * named role (e.g. "Employee", "Manager"); what signers typed or drew is never copied.
 *
 * Props: doc (DocumentResponse with signatories), onClose(), openList (go to the Templates tab after saving)
 */
export default function SaveAsTemplateModal({ doc, onClose, openList = true }) {
  const navigate = useNavigate()
  const toast = useToast()
  const signers = [...(doc.signatories?.length ? doc.signatories : [{ name: doc.clientName }])]
    .sort((a, b) => (a.signingOrder || 0) - (b.signingOrder || 0))
  const [name, setName] = useState(doc.title || '')
  const [description, setDescription] = useState('')
  const [roles, setRoles] = useState(signers.map((_, i) => signers.length === 1 ? 'Signer' : `Signer ${i + 1}`))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    if (!name.trim()) { setError('Give the template a name.'); return }
    setBusy(true); setError(null)
    try {
      await esignSaveAsTemplate(doc.id, { name: name.trim(), description: description.trim(), roles: roles.map(r => r.trim()) })
      toast.success(openList ? 'Template saved' : 'Template saved — find it under E-Sign → Templates')
      onClose()
      if (openList) navigate('/esign?tab=templates')
    } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-ink dark:text-white">Save as template</h2>
        <p className="text-sm text-ink-3 mt-1">
          Reuse this PDF and its field layout. Next time you only enter who signs. Values signers entered are not copied.
        </p>

        <label className="form-label mt-5" htmlFor="sat-name">Template name</label>
        <input id="sat-name" className="form-input" value={name} onChange={e => setName(e.target.value)} maxLength={120} />

        <label className="form-label mt-4" htmlFor="sat-desc">Description (optional)</label>
        <input id="sat-desc" className="form-input" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />

        <p className="form-label mt-5">Signer roles</p>
        <div className="space-y-2">
          {signers.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <input className="form-input flex-1" aria-label={`Role ${i + 1}`} value={roles[i]} maxLength={60}
                onChange={e => setRoles(rs => rs.map((r, k) => k === i ? e.target.value : r))} />
              <span className="text-xs text-ink-4 truncate w-40" title={s.email}>was {s.name || s.email}</span>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-danger mt-4">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary disabled:opacity-60" disabled={busy}>{busy ? 'Saving…' : 'Save template'}</button>
        </div>
      </form>
    </div>
  )
}
