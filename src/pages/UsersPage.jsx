import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, searchUsers, getOrganizations, enableUser, disableUser, resendInvite } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import { useAuth, ROLES } from '../context/AuthContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'
import useUrlState from '../hooks/useUrlState'
import UserFormModal from '../components/users/UserFormModal'
import { canManageUser } from '../utils/userPermissions'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Users' },
]

const ROLE_BADGE = {
  PLATFORM_ADMIN: 'bg-accent-100 text-accent-700',
  ORG_ADMIN:      'bg-brand-100 text-brand-700',
  ADMIN:          'bg-blue-100   text-blue-700',
  USER:           'bg-gray-100   text-gray-600',
}

import { fmtDate } from '../utils/date'

function Avatar({ user, size = 'sm' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  if (user.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${s} rounded-full object-cover shrink-0`} />
  }
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  const colors = ['bg-brand-500','bg-accent-500','bg-pink-500','bg-emerald-500','bg-amber-500']
  const bg = colors[(user.email?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`${s} ${bg} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  useDocumentTitle('Users')
  const toast      = useToast()
  const { user: me } = useAuth()
  const isPlatformAdmin = me?.role === ROLES.PLATFORM_ADMIN

  const [users,    setUsers]    = useState([])
  const [orgs,     setOrgs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  // List filters live in the URL (?search=&orgId=&status=) so Back from a record restores them
  const [q, setQ]                 = useUrlState({ search: '', orgId: '', status: 'all' })
  const orgFilter    = q.orgId
  const statusFilter = q.status    // 'all' | 'active' | 'inactive'
  const [query,    setQuery]    = useState(q.search)   // input text; debounced into the URL
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resendingId, setResendingId] = useState(null)
  const navigate = useNavigate()
  /** Opens the user's profile — ignores clicks that started on a button or link inside the row/card. */
  const openProfile = (e, u) => {
    if (e.target.closest('button, a, input, select')) return
    navigate(u.id === me?.id ? '/profile' : `/users/${u.id}`)
  }

  /* Load orgs for filter/form */
  useEffect(() => {
    if (isPlatformAdmin) {
      getOrganizations().then(setOrgs).catch(() => {})
    }
  }, [isPlatformAdmin])

  const [view, setView] = useView('braify-users-view')

  const load = useCallback((q = '', orgId = '') => {
    setLoading(true)
    const fn = q.trim()
      ? searchUsers(q, orgId)
      : getUsers()
    fn.then(data => {
      // Client-side org filter when not searching
      if (!q.trim() && orgId) {
        setUsers(data.filter(u => u.organizationId === orgId))
      } else {
        setUsers(data)
      }
    })
      .catch(err => toast.error(err.message || 'Could not load users.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Single effect: immediate load when query is empty, debounced when typing */
  useEffect(() => {
    if (!query.trim()) {
      load('', orgFilter)
      return
    }
    const t = setTimeout(() => load(query, orgFilter), 350)
    return () => clearTimeout(t)
  }, [query, orgFilter, load])

  useEffect(() => {
    if (query.trim() === q.search) return
    const t = setTimeout(() => setQ({ search: query.trim() }), 350)
    return () => clearTimeout(t)
  }, [query, q.search]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditUser(null); setShowForm(true) }
  const openEdit   = (u) => { setEditUser(u); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditUser(null) }

  const handleDisable = async (u) => {
    if (!confirm(`Disable "${u.firstName} ${u.lastName}"? Their active sessions will be revoked immediately.`)) return
    try {
      await disableUser(u.id)
      toast.success('User disabled and sessions revoked.')
      load(query, orgFilter)
    } catch (err) {
      toast.error(err.message || 'Failed to disable user.')
    }
  }

  const handleEnable = async (u) => {
    if (!confirm(`Re-enable "${u.firstName} ${u.lastName}"?`)) return
    try {
      await enableUser(u.id)
      toast.success('User enabled.')
      load(query, orgFilter)
    } catch (err) {
      toast.error(err.message || 'Failed to enable user.')
    }
  }

  const handleResendInvite = async (u) => {
    setResendingId(u.id)
    try {
      await resendInvite(u.id)
      toast.success(`Invitation re-sent to ${u.email}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to resend invite.')
    } finally {
      setResendingId(null)
    }
  }

  const orgName = (orgId) => orgs.find(o => o.id === orgId)?.name ?? orgId ?? '—'

  const filteredUsers = users.filter(u => {
    if (statusFilter === 'active')   return u.active
    if (statusFilter === 'inactive') return !u.active
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white">Users</h1>
          <p className="text-sm text-ink-3 mt-1">Manage platform users and their roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button onClick={openCreate} className="btn btn-primary gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Invite User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" className="form-input pl-9" placeholder="Search by name or email…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        {isPlatformAdmin && (
          <select className="form-select w-auto" value={orgFilter}
            onChange={e => setQ({ orgId: e.target.value })}>
            <option value="">All Organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <select className="form-select w-auto" value={statusFilter} onChange={e => setQ({ status: e.target.value })}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User list */}
      {loading ? (
        <div className="card flex items-center justify-center py-20 text-ink-4 gap-3">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading…
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-ink-4">
          <svg className="w-10 h-10 mb-3 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p className="text-sm">{query ? `No users match "${query}".` : 'No users found.'}</p>
        </div>
      ) : view === 'grid' ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => (
            <div key={u.id} onClick={e => openProfile(e, u)} title="View profile"
              className="card card-hover p-5 flex flex-col gap-3 cursor-pointer">
              <div className="flex items-start gap-3">
                <Avatar user={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink dark:text-gray-200 truncate">
                    {u.firstName} {u.lastName}
                    {u.invitePending && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                        INVITE PENDING
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-4 truncate">{u.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0
                  ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                  {u.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                  {u.role.replace('_', ' ')}
                </span>
                {isPlatformAdmin && (u.organizationName || orgName(u.organizationId)) && (
                  <span className="text-xs text-ink-4">{u.organizationName || orgName(u.organizationId)}</span>
                )}
              </div>

              <p className="text-[11px] text-ink-4 mt-auto">Joined {fmtDate(u.createdAt)}</p>

              {canManageUser(me, u) && <div className="flex items-center gap-1 pt-1 border-t border-ink-7 dark:border-gray-700">
                <button onClick={() => openEdit(u)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600 text-ink-3 hover:border-primary hover:text-primary transition-colors">
                  Edit
                </button>
                {u.invitePending && (
                  <button onClick={() => handleResendInvite(u)} disabled={resendingId === u.id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {resendingId === u.id ? 'Sending…' : 'Resend Invite'}
                  </button>
                )}
                {u.active ? (
                  <button onClick={() => handleDisable(u)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors">
                    Disable
                  </button>
                ) : (
                  <button onClick={() => handleEnable(u)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                    Enable
                  </button>
                )}
              </div>}
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-7 dark:border-gray-700 bg-ink-8 dark:bg-gray-900/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Role</th>
                {isPlatformAdmin && <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Organization</th>}
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-ink-3 uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredUsers.map(u => (
                <tr key={u.id} onClick={e => openProfile(e, u)} title="View profile"
                  className="hover:bg-ink-8 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <div>
                        <p className="font-medium text-ink dark:text-gray-200">
                          {u.firstName} {u.lastName}
                          {u.invitePending && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                              INVITE PENDING
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-4">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  {isPlatformAdmin && (
                    <td className="px-5 py-3.5 text-xs text-ink-3">
                      {u.organizationName || orgName(u.organizationId)}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-4">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    {canManageUser(me, u) && <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-ink-7 dark:border-gray-600
                                   text-ink-3 hover:border-primary hover:text-primary transition-colors">
                        Edit
                      </button>
                      {u.invitePending && (
                        <button onClick={() => handleResendInvite(u)} disabled={resendingId === u.id}
                          className="text-xs px-2.5 py-1 rounded-lg border border-amber-200
                                     text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed">
                          {resendingId === u.id ? 'Sending…' : 'Resend Invite'}
                        </button>
                      )}
                      {u.active ? (
                        <button onClick={() => handleDisable(u)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200
                                     text-red-400 hover:bg-red-50 hover:border-red-400 transition-colors">
                          Disable
                        </button>
                      ) : (
                        <button onClick={() => handleEnable(u)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200
                                     text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors">
                          Enable
                        </button>
                      )}
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <UserFormModal
          editUser={editUser}
          isPlatformAdmin={isPlatformAdmin}
          orgs={orgs}
          defaultOrgId={me?.organizationId || ''}
          onClose={closeForm}
          onSaved={() => load(query, orgFilter)}
        />
      )}
    </div>
  )
}

