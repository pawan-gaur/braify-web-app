import { useState, useEffect, useCallback } from 'react'
import {
  getGlobalPlaceholders, createGlobalPlaceholder,
  updateGlobalPlaceholder, deleteGlobalPlaceholder,
} from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Global Placeholders' },
]

const KEY_RE = /^[A-Za-z0-9_.]+$/

const emptyForm = { key: '', value: '', label: '', type: 'TEXT' }

export default function GlobalPlaceholdersPage() {
  useDocumentTitle('Global Placeholders')
  const toast = useToast()

  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getGlobalPlaceholders()
      .then(setItems)
      .catch(err => toast.error(err.message || 'Could not load placeholders.'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (p) => {
    setEditItem(p)
    setForm({ key: p.key, value: p.value ?? '', label: p.label ?? '', type: p.type ?? 'TEXT' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditItem(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    const key = form.key.trim()
    if (!key) { toast.error('Key is required.'); return }
    if (!KEY_RE.test(key)) {
      toast.error('Key may only contain letters, digits, underscore and dot.')
      return
    }
    setSaving(true)
    try {
      const payload = { key, value: form.value, label: form.label.trim(), type: form.type }
      if (editItem) {
        await updateGlobalPlaceholder(editItem.id, payload)
        toast.success('Placeholder updated.')
      } else {
        await createGlobalPlaceholder(payload)
        toast.success('Placeholder created.')
      }
      closeForm()
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to save placeholder.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    if (!confirm(`Delete placeholder "{{${p.key}}}"? Templates using it will no longer be filled automatically.`)) return
    setDeletingId(p.id)
    try {
      await deleteGlobalPlaceholder(p.id)
      toast.success('Placeholder deleted.')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to delete placeholder.')
    } finally {
      setDeletingId(null)
    }
  }

  const copyToken = (key) => {
    const token = `{{${key}}}`
    navigator.clipboard?.writeText(token)
    toast.success(`Copied ${token}`)
  }

  const isImageUrl = (v) => typeof v === 'string' && /^(https?:\/\/|data:image\/)/i.test(v.trim())

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="flex items-center justify-between mt-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Global Placeholders</h1>
          <p className="text-sm text-ink-3 mt-1 max-w-2xl">
            Reusable values for your organization. When an email or PDF template uses a{' '}
            <code className="px-1 rounded bg-ink-8 dark:bg-gray-800">{'{{key}}'}</code> token that matches one of these,
            its value is filled in automatically when the document is sent or generated.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Placeholder
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20 text-ink-4 gap-3 mt-6">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-ink-4 mt-6">
          <svg className="w-10 h-10 mb-3 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
          </svg>
          <p className="text-sm">No global placeholders yet.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-primary font-semibold hover:underline">
            Add your first one
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-7 dark:border-gray-700 bg-ink-8 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Token</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Label</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Value</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-ink-8 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <button onClick={() => copyToken(p.key)}
                      title="Copy token"
                      className="font-mono text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 hover:ring-1 hover:ring-brand-300">
                      {`{{${p.key}}}`}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-ink-3">{p.label || '—'}</td>
                  <td className="px-5 py-3.5 max-w-xs">
                    {p.type === 'IMAGE' && isImageUrl(p.value) ? (
                      <div className="flex items-center gap-2">
                        <img src={p.value} alt="" className="h-8 w-8 rounded object-contain bg-ink-8 dark:bg-gray-800 shrink-0" />
                        <span className="text-xs text-ink-4 truncate">{p.value}</span>
                      </div>
                    ) : (
                      <span className="text-ink-2 dark:text-gray-300 truncate block">{p.value || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-primary hover:text-primary transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50">
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {editItem ? 'Edit Placeholder' : 'Add Placeholder'}
              </h2>
              <button onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-ink-4 hover:bg-ink-8 dark:hover:bg-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Key *</label>
                <input className="form-input font-mono" placeholder="organization_name"
                  value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} required />
                <p className="text-xs text-ink-4 mt-1">
                  Used in templates as <code className="px-1 rounded bg-ink-8 dark:bg-gray-800">{`{{${form.key.trim() || 'key'}}}`}</code>. Letters, digits, underscore, dot only.
                </p>
              </div>
              <div>
                <label className="form-label">Label</label>
                <input className="form-input" placeholder="Organization name"
                  value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image (URL / data-URL)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Value</label>
                <textarea className="form-input min-h-[80px]"
                  placeholder={form.type === 'IMAGE' ? 'https://…/logo.png' : 'Acme Inc.'}
                  value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Placeholder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
