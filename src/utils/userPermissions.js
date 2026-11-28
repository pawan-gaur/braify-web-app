/**
 * Same rules as the backend (UserService.canAssignRole / canManage) — the UI only uses them
 * to hide what the server would refuse.
 */
const RANK = { PLATFORM_ADMIN: 4, ORG_ADMIN: 3, ADMIN: 2, USER: 1 }

/** Roles a user with `myRole` may give out when inviting or editing someone. */
export function assignableRoles(myRole) {
  switch (myRole) {
    case 'PLATFORM_ADMIN':
    case 'ORG_ADMIN': return ['ORG_ADMIN', 'ADMIN', 'USER']
    case 'ADMIN':     return ['USER']
    default:          return []
  }
}

/** Whether `me` may edit / enable / disable / resend an invite to `target`. */
export function canManageUser(me, target) {
  if (!me || !target) return false
  if (me.role === 'PLATFORM_ADMIN') return true
  if (me.id && me.id === target.id) return false
  if (target.role === 'PLATFORM_ADMIN') return false
  if (me.role === 'ORG_ADMIN') return true
  return (RANK[target.role] ?? 0) < (RANK[me.role] ?? 0)
}
