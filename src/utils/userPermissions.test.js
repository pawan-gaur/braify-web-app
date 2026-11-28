import { describe, it, expect } from 'vitest'
import { assignableRoles, canManageUser } from './userPermissions'

const u = (id, role) => ({ id, role })

describe('assignableRoles', () => {
  it('lets an Admin give out User only', () => expect(assignableRoles('ADMIN')).toEqual(['USER']))
  it('lets an Org Admin appoint co-owners', () => expect(assignableRoles('ORG_ADMIN')).toContain('ORG_ADMIN'))
  it('gives a User nothing', () => expect(assignableRoles('USER')).toEqual([]))
})

describe('canManageUser', () => {
  it('blocks an Admin from managing an Org Admin or another Admin', () => {
    expect(canManageUser(u('a', 'ADMIN'), u('o', 'ORG_ADMIN'))).toBe(false)
    expect(canManageUser(u('a', 'ADMIN'), u('b', 'ADMIN'))).toBe(false)
    expect(canManageUser(u('a', 'ADMIN'), u('c', 'USER'))).toBe(true)
  })
  it('lets an Org Admin manage a co-Org Admin but not themselves', () => {
    expect(canManageUser(u('o', 'ORG_ADMIN'), u('p', 'ORG_ADMIN'))).toBe(true)
    expect(canManageUser(u('o', 'ORG_ADMIN'), u('o', 'ORG_ADMIN'))).toBe(false)
  })
})
