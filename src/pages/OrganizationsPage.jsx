import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrganizations, searchOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Organizations' },
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrganizationsPage() {
  useDocumentTitle('Organizations')
  const navigate = useNavigate()
  const toast    = useToast()

  const [orgs,     setOrgs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editOrg,  setEditOrg]  = useState(null)   // org being edited (null = create mode)
  const [saving,   setSaving]   = useState(false)

  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const load = useCallback((q = '') => {
    setLoading(true)
    const fn = q.trim() ? searchOrganizations(q) : getOrganizations()
    fn.then(setOrgs)
      .catch(err => toast.error(err.message || 'Could not load organizations.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Single effect: immediate load when query is empty, debounced when typing */
  useEffect(() => {
    if (!query.trim()) {
      load()
      return
    }
    const t = setTimeout(() => load(query), 350)
    return () => clearTimeout(t)
  }, [query, load])

  const openCreate = () => { setEditOrg(null); setForm({ name: '', code: '', description: '' }); setShowForm(true) }
  const openEdit   = (org) => { setEditOrg(org); setForm({ name: org.name, code: org.code, description: org.description || '' }); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditOrg(null) }

  const codify = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v, code: editOrg ? f.code : codify(v) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code are required.'); return }
    setSaving(true)
    try {
      if (editOrg) {
        await updateOrganization(editOrg.id, form)
        toast.success('Organization updated.')
      } else {
        await createOrganization(form)
        toast.success('Organization created.')
      }
      closeForm()
      load(query)
    } catch (err) {
      toast.error(err.message || 'Failed to save organization.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (org) => {
    if (!confirm(`Delete organization "${org.name}"? This is a soft delete.`)) return
    try {
      await deleteOrganization(org.id)
      toast.success('Organization deleted.')
      load(query)
    } catch (err) {
      toast.error(err.message || 'Delete failed.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all tenant organizations on the platform.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          className="form-input pl-9"
          placeholder="Search by name or code…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Loading…
          </div>
        ) : orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <p className="text-sm">{query ? `No organizations match "${query}".` : 'No organizations yet.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{org.name}</p>
                    {org.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{org.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      {org.code}
                    </code>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${org.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${org.active ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                      {org.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{fmtDate(org.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/users?orgId=${org.id}`)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                                   text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                        title="View users"
                      >
                        Users
                      </button>
                      <button
                        onClick={() => openEdit(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                                   text-gray-500 hover:border-primary hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200
                                   text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {editOrg ? 'Edit Organization' : 'New Organization'}
              </h2>
              <button onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Organization Name *</label>
                <input className="form-input" placeholder="Acme Corp"
                  value={form.name} onChange={e => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Code *</label>
                <input className="form-input font-mono" placeholder="acme-corp"
                  value={form.code} onChange={e => setForm(f => ({ ...f, code: codify(e.target.value) }))}
                  disabled={!!editOrg} required />
                {!editOrg && <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Cannot be changed later.</p>}
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input resize-none" rows={3} placeholder="Optional description…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Saving…' : editOrg ? 'Save Changes' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
