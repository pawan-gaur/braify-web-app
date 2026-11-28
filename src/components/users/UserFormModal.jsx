import { useState } from 'react'
import { createUser, updateUser } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { assignableRoles } from '../../utils/userPermissions'

export const ROLE_OPTIONS = [
  { value: 'ORG_ADMIN', label: 'Org Admin' },
  { value: 'ADMIN',     label: 'Admin' },
  { value: 'USER',      label: 'User' },
]

/**
 * Invite (editUser = null) or edit a user. Shared by the Users list and the user profile page.
 *
 * Props:
 *   editUser        – the user being edited, or null to invite a new one
 *   isPlatformAdmin – shows the organisation picker
 *   orgs            – organisations for the picker (Platform Admin only)
 *   defaultOrgId    – pre-selected organisation for a new user
 *   onClose()       – close without saving
 *   onSaved(user)   – called after a successful save (the modal closes itself)
 */
export default function UserFormModal({ editUser, isPlatformAdmin, orgs = [], defaultOrgId = '', onClose, onSaved }) {
  const toast = useToast()
  const { user: me } = useAuth()
  const isSelf = !!editUser && editUser.id === me?.id
  // Only roles this user may give out (an Admin can't create Org Admins); keep the current
  // role visible when editing someone whose role you couldn't assign yourself.
  const allowed = assignableRoles(me?.role)
  const roleOptions = ROLE_OPTIONS.filter(r => allowed.includes(r.value) || r.value === editUser?.role)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => editUser
    ? { email: editUser.email, firstName: editUser.firstName, lastName: editUser.lastName,
        role: editUser.role, organizationId: editUser.organizationId || '', sendInvite: false }
    : { email: '', firstName: '', lastName: '', role: 'USER', organizationId: defaultOrgId || '', sendInvite: true })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.email || !form.firstName || !form.lastName) { toast.error('Email, first name and last name are required.'); return }
    setSaving(true)
    try {
      let saved
      if (editUser) {
        saved = await updateUser(editUser.id, form)
        toast.success('User updated.')
      } else {
        saved = await createUser(form)
        toast.success(form.sendInvite ? 'User created — invite email sent.' : 'User created.')
      }
      onClose()
      onSaved?.(saved)
    } catch (err) {
      toast.error(err.message || 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
            {editUser ? 'Edit User' : 'Invite New User'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-ink-4 hover:bg-ink-8 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {!editUser && (
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="user@company.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First Name *</label>
              <input className="form-input" placeholder="Jane"
                value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input className="form-input" placeholder="Smith"
                value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="form-label">Role *</label>
            <select className="form-select" value={form.role} disabled={isSelf}
              title={isSelf ? "You can't change your own role" : undefined}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {isPlatformAdmin && (
            <div>
              <label className="form-label">Organization</label>
              <select className="form-select" value={form.organizationId}
                onChange={e => setForm(f => ({ ...f, organizationId: e.target.value }))}>
                <option value="">— Select Organization —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          {!editUser && (
            <p className="text-xs text-ink-4 p-3 rounded-xl border border-ink-7 dark:border-gray-700">
              They'll get an email invitation with a link (valid for 7 days) to set their password.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
