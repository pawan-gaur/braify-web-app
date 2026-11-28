import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { esignListTemplates, esignDeleteTemplate, esignUseTemplate, esignSuggestContacts } from '../../services/api'
import { useAuth, ROLES } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import EmailAutocomplete from '../ui/EmailAutocomplete'
import { fmtDateTime } from '../../utils/date'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * "Templates" tab of the e-sign list: reusable PDF + field layouts saved from a document
 * ("Save as template" on a document). "Use" fills each signer role and creates a draft that
 * opens in the builder for a final review before sending.
 */
export default function ESignTemplatesTab() {
  const { user } = useAuth()
  const toast = useToast()
  const [templates, setTemplates] = useState(null)
  const [using, setUsing] = useState(null)   // template being used

  const load = useCallback(() => {
    if (!user?.organizationId) { setTemplates([]); return }   // templates belong to an organisation
    esignListTemplates().then(setTemplates).catch(e => { toast.error(e.message); setTemplates([]) })
  }, [user?.organizationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const canManage = t => t.createdBy === user?.id
    || [ROLES.ADMIN, ROLES.ORG_ADMIN, ROLES.PLATFORM_ADMIN].includes(user?.role)

  const remove = async t => {
    if (!window.confirm(`Delete the template “${t.name}”? Documents already created from it are not affected.`)) return
    try { await esignDeleteTemplate(t.id); toast.success('Template deleted'); load() }
    catch (e) { toast.error(e.message) }
  }

  if (templates === null) return <div className="skeleton h-24 rounded-card" />

  if (templates.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-ink dark:text-white">No templates yet</p>
        <p className="text-sm text-ink-3 mt-1 max-w-md mx-auto">
          Send the same agreement often? Open a document, place its fields once, then choose
          <span className="font-semibold"> Save as template</span>. Next time you only enter who signs.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="card p-5 flex flex-col">
            <p className="font-bold text-ink dark:text-white truncate" title={t.name}>{t.name}</p>
            {t.description && <p className="text-sm text-ink-3 mt-1 line-clamp-2">{t.description}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {t.roles.map((r, i) => <span key={i} className="badge badge-gray">{t.signingMode === 'SEQUENTIAL' ? `${i + 1}. ` : ''}{r}</span>)}
            </div>
            <p className="text-xs text-ink-4 mt-3">
              {t.fieldCount} field{t.fieldCount === 1 ? '' : 's'} · used {t.useCount}×
              {t.lastUsedAt ? ` · last ${fmtDateTime(t.lastUsedAt)}` : ''}
            </p>
            <div className="flex gap-2 mt-4 pt-3 border-t border-ink-8 dark:border-gray-700 mt-auto">
              <button className="btn btn-primary btn-sm" onClick={() => setUsing(t)}>Use</button>
              {canManage(t) && <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(t)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
      {using && <UseTemplateModal template={using} onClose={() => setUsing(null)} />}
    </>
  )
}

function UseTemplateModal({ template, onClose }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [title, setTitle] = useState(template.documentTitle || template.name)
  const [people, setPeople] = useState(template.roles.map(() => ({ name: '', email: '' })))
  const [contacts, setContacts] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { esignSuggestContacts().then(setContacts).catch(() => {}) }, [])

  const set = (i, patch) => setPeople(ps => ps.map((p, k) => k === i ? { ...p, ...patch } : p))

  const submit = async e => {
    e.preventDefault()
    if (people.some(p => !p.name.trim() || !EMAIL_RE.test(p.email.trim()))) {
      setError('Each role needs a name and a valid email.'); return
    }
    const emails = people.map(p => p.email.trim().toLowerCase())
    if (new Set(emails).size !== emails.length) { setError('Each signer must have a different email.'); return }
    setBusy(true); setError(null)
    try {
      const doc = await esignUseTemplate(template.id, {
        title: title.trim(),
        signatories: people.map(p => ({ name: p.name.trim(), email: p.email.trim() })),
      })
      toast.success('Draft created — review the fields and send.')
      navigate(`/esign/${doc.id}`)
    } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-ink dark:text-white">Use “{template.name}”</h2>
        <p className="text-sm text-ink-3 mt-1">Fill in who signs. You’ll review the draft before anything is sent.</p>

        <label className="form-label mt-5" htmlFor="tpl-title">Document title</label>
        <input id="tpl-title" className="form-input" value={title} onChange={e => setTitle(e.target.value)} />

        <div className="space-y-4 mt-5">
          {template.roles.map((role, i) => (
            <fieldset key={i}>
              <legend className="form-label">{template.signingMode === 'SEQUENTIAL' ? `${i + 1}. ` : ''}{role}</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                <input className="form-input" placeholder="Full name" aria-label={`${role} name`}
                  value={people[i].name} onChange={e => set(i, { name: e.target.value })} />
                <EmailAutocomplete className="form-input" placeholder="email@example.com" contacts={contacts}
                  value={people[i].email} onChange={v => set(i, { email: v })}
                  onSelect={c => set(i, { email: c.email, name: people[i].name || c.name || '' })} />
              </div>
            </fieldset>
          ))}
        </div>

        {error && <p className="text-sm text-danger mt-4">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary disabled:opacity-60" disabled={busy}>{busy ? 'Creating…' : 'Create draft'}</button>
        </div>
      </form>
    </div>
  )
}
