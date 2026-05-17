import axios from 'axios'

const TOKEN_KEY = 'pdf-builder-token'

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Request interceptor — attach the JWT token stored in localStorage to every
 * outgoing request so authenticated endpoints work automatically.
 */
http.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Response interceptor — normalises every API error into a plain Error whose
 * .message is the text returned by the backend.
 * 401 responses trigger a hard redirect to /login so the user can re-authenticate.
 */
http.interceptors.response.use(
  res => res,
  err => {
    const data    = err.response?.data
    const status  = err.response?.status

    // Unauthorised → session expired or token revoked → send to login
    if (status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }

    // Backend sends { message, status, timestamp } via GlobalExceptionHandler
    const message =
      (typeof data === 'object' && data?.message)
        ? data.message
        : (typeof data === 'string' && data.trim())
          ? data.trim()
          : err.message || `HTTP ${status ?? 'error'}`

    const normalised         = new Error(message)
    normalised.status        = status
    normalised.rawData       = data
    normalised.originalError = err
    return Promise.reject(normalised)
  }
)

// ── Templates ──────────────────────────────────────────────
export const getTemplates = () => http.get('/templates').then(r => r.data)
export const getTemplate  = (id) => http.get(`/templates/${id}`).then(r => r.data)
export const createTemplate = (payload) => http.post('/templates', payload).then(r => r.data)
export const updateTemplate = (id, payload) => http.put(`/templates/${id}`, payload).then(r => r.data)
export const deleteTemplate = (id) => http.delete(`/templates/${id}`)

// ── Email templates ────────────────────────────────────────
export const getEmailTemplates    = ()         => http.get('/email-templates').then(r => r.data)
export const getEmailTemplate     = (id)       => http.get(`/email-templates/${id}`).then(r => r.data)
export const createEmailTemplate  = (payload)  => http.post('/email-templates', payload).then(r => r.data)
export const updateEmailTemplate  = (id, p)    => http.put(`/email-templates/${id}`, p).then(r => r.data)
export const deleteEmailTemplate  = (id)       => http.delete(`/email-templates/${id}`)
export const sendEmailTemplate    = (id, payload) => http.post(`/email-templates/${id}/send`, payload).then(r => r.data)

// ── Email template versions ────────────────────────────────
export const getEmailTemplateVersions    = (id)    => http.get(`/email-templates/${id}/versions`).then(r => r.data)
export const getEmailTemplateVersion     = (id, v) => http.get(`/email-templates/${id}/versions/${v}`).then(r => r.data)
export const restoreEmailTemplateVersion = (id, v) => http.post(`/email-templates/${id}/versions/${v}/restore`).then(r => r.data)

// ── Version history ────────────────────────────────────────
export const getTemplateVersions    = (id)              => http.get(`/templates/${id}/versions`).then(r => r.data)
export const getTemplateVersion     = (id, v)           => http.get(`/templates/${id}/versions/${v}`).then(r => r.data)
export const restoreTemplateVersion = (id, v)           => http.post(`/templates/${id}/versions/${v}/restore`).then(r => r.data)

// ── Audit log ──────────────────────────────────────────────
export const getAuditLogs = (
  page = 0, size = 20,
  resourceType = null, orgId = null,
  action = null, performedBy = null,
  from = null, to = null,
) =>
  http.get('/audit-logs', {
    params: {
      page, size,
      ...(resourceType ? { resourceType } : {}),
      ...(orgId        ? { orgId }        : {}),
      ...(action       ? { action }       : {}),
      ...(performedBy  ? { performedBy }  : {}),
      ...(from         ? { from }         : {}),
      ...(to           ? { to }           : {}),
    },
  }).then(r => r.data)

export const getAuditLogStats = (orgId = null) =>
  http.get('/audit-logs/stats', { params: orgId ? { orgId } : {} }).then(r => r.data)

export const exportAuditLogs = (params = {}) =>
  http.get('/audit-logs/export', { params, responseType: 'blob' }).then(r => r.data)

export const getTemplateAuditLogs = (id) => http.get(`/audit-logs/template/${id}`).then(r => r.data)

// ── Dashboard ──────────────────────────────────────────────
export const getDashboardStats = () => http.get('/dashboard').then(r => r.data)

// ── Onboarding Requests ─────────────────────────────────────
export const submitOnboardingRequest  = (data)           => http.post('/onboarding', data).then(r => r.data)
export const getOnboardingRequests    = (status = null)  => http.get('/onboarding', { params: status ? { status } : {} }).then(r => r.data)
export const getOnboardingRequest     = (id)             => http.get(`/onboarding/${id}`).then(r => r.data)
export const getPendingOnboardingCount= ()               => http.get('/onboarding/count/pending').then(r => r.data)
export const reviewOnboardingRequest  = (id, payload)    => http.put(`/onboarding/${id}/review`, payload).then(r => r.data)

// ── Organizations (Platform Admin) ─────────────────────────
export const getOrganizations    = ()         => http.get('/organizations').then(r => r.data)
export const searchOrganizations = (q)        => http.get('/organizations/search', { params: { q } }).then(r => r.data)
export const createOrganization  = (payload)  => http.post('/organizations', payload).then(r => r.data)
export const updateOrganization  = (id, p)    => http.put(`/organizations/${id}`, p).then(r => r.data)
export const deleteOrganization  = (id)       => http.delete(`/organizations/${id}`)

// ── Organization Features ───────────────────────────────────
export const getOrgFeatures    = (id)         => http.get(`/organizations/${id}/features`).then(r => r.data)
export const updateOrgFeatures = (id, feats)  => http.put(`/organizations/${id}/features`, { features: feats }).then(r => r.data)

// ── Users (Platform Admin / Org Admin / Admin) ─────────────
export const getUsers       = ()                   => http.get('/users').then(r => r.data)
export const searchUsers    = (q, orgId)           => http.get('/users/search', { params: { q, orgId } }).then(r => r.data)
export const createUser     = (payload)            => http.post('/users', payload).then(r => r.data)
export const updateUser     = (id, payload)        => http.put(`/users/${id}`, payload).then(r => r.data)
export const deactivateUser = (id)                 => http.delete(`/users/${id}`)
export const enableUser     = (id)                 => http.put(`/users/${id}/enable`)
export const disableUser    = (id)                 => http.put(`/users/${id}/disable`)

// ── Sessions ───────────────────────────────────────────────
export const getSessions          = ()   => http.get('/sessions').then(r => r.data)
export const revokeSession        = (id) => http.delete(`/sessions/${id}`)
export const revokeOtherSessions  = ()   => http.delete('/sessions/me/others').then(r => r.data)

// ── Auth — invite / password reset ─────────────────────────
export const validateInviteToken = (token)            => http.get('/auth/validate-token', { params: { token } }).then(r => r.data)
export const acceptInvite        = (token, password)  => http.post('/auth/accept-invite', { token, password }).then(r => r.data)
export const forgotPassword      = (email)            => http.post('/auth/forgot-password', { email }).then(r => r.data)
export const resetPassword       = (token, password)  => http.post('/auth/reset-password', { token, password }).then(r => r.data)

// ── Profile (self) ─────────────────────────────────────────
export const getMyProfile    = ()        => http.get('/profile/me').then(r => r.data)
export const updateProfile   = (payload) => http.put('/profile/me', payload).then(r => r.data)
export const changePassword  = (payload) => http.put('/profile/me/password', payload).then(r => r.data)
export const uploadAvatar    = (avatar)  => http.post('/profile/me/avatar', { avatar }).then(r => r.data)
export const getMyAuditLog   = ()        => http.get('/profile/me/audit').then(r => r.data)

// ── E-Sign (Creator) ───────────────────────────────────────
export const esignCreateDocument  = (payload)              => http.post('/esign/documents', payload).then(r => r.data)
export const esignListDocuments   = ()                     => http.get('/esign/documents').then(r => r.data)
export const esignGetDocument     = (id)                   => http.get(`/esign/documents/${id}`).then(r => r.data)
export const esignSaveFields      = (id, fields)           => http.put(`/esign/documents/${id}/fields`, fields).then(r => r.data)
export const esignSendDocument    = (id, days = 7)         => http.post(`/esign/documents/${id}/send?tokenValidDays=${days}`).then(r => r.data)
export const esignCancelDocument  = (id)                   => http.post(`/esign/documents/${id}/cancel`).then(r => r.data)
export const esignResendDocument  = (id, days = 7)         => http.post(`/esign/documents/${id}/resend?tokenValidDays=${days}`).then(r => r.data)
export const esignGetAudit        = (id)                   => http.get(`/esign/documents/${id}/audit`).then(r => r.data)
export const esignDownloadSigned  = (id)                   => http.get(`/esign/documents/${id}/signed-pdf`, { responseType: 'blob' }).then(r => r.data)

// ── E-Sign (Client — uses signing JWT directly in header) ──
export const esignOpenDocument    = (token)                => http.get(`/esign/sign/${token}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)
export const esignSignField       = (token, fieldId, body) => http.put(`/esign/sign/${token}/fields/${fieldId}`, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)
export const esignSubmitDocument  = (token)                => http.post(`/esign/sign/${token}/submit`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)

// ── E-Sign Verify (public) ─────────────────────────────────
export const esignVerifyDocument  = (id)                   => http.get(`/esign/verify/${id}`).then(r => r.data)

// ── Subscription (Platform Admin) ──────────────────────────
export const getSubscription    = (orgId)           => http.get(`/organizations/${orgId}/subscription`).then(r => r.data)
export const assignSubscription = (orgId, payload)  => http.put(`/organizations/${orgId}/subscription`, payload).then(r => r.data)

// ── Quota config & usage ────────────────────────────────────
export const getQuotaConfig    = (orgId)          => http.get(`/organizations/${orgId}/quota/config`).then(r => r.data)
export const updateQuotaConfig = (orgId, payload) => http.put(`/organizations/${orgId}/quota/config`, payload).then(r => r.data)
export const getUsageHistory   = (orgId)          => http.get(`/organizations/${orgId}/quota/usage`).then(r => r.data)

// ── Org Branding ────────────────────────────────────────────
export const getBranding    = (orgId)           => http.get(`/organizations/${orgId}/branding`).then(r => r.data)
export const updateBranding = (orgId, payload)  => http.put(`/organizations/${orgId}/branding`, payload).then(r => r.data)

// ── Template Sharing ────────────────────────────────────────
export const shareTemplate        = (payload)     => http.post('/sharing', payload).then(r => r.data)
export const revokeShare          = (id)          => http.delete(`/sharing/${id}`)
export const getReceivedShares    = ()            => http.get('/sharing/received').then(r => r.data)
export const getSentShares        = ()            => http.get('/sharing/sent').then(r => r.data)
export const getSharesForTemplate = (templateId) => http.get(`/sharing/template/${templateId}`).then(r => r.data)

// ── PDF Generation ─────────────────────────────────────────
export const generatePdf = async (templateId, data, filename) => {
  const response = await http.post(
    '/generate-pdf',
    { templateId, data, filename },
    { responseType: 'blob' }
  )
  // Trigger browser download
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'document.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

export const previewPdfBlob = async (templateId, data) => {
  const response = await http.post(
    '/preview-pdf',
    { templateId, data },
    { responseType: 'blob' }
  )
  return URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
}

// ── API Keys ───────────────────────────────────────────────────
export const getApiKeys     = (orgId)          => http.get(`/organizations/${orgId}/api-keys`).then(r => r.data)
export const getAllApiKeys   = ()               => http.get('/admin/api-keys').then(r => r.data)   // Platform Admin: all orgs
export const createApiKey   = (orgId, payload) => http.post(`/organizations/${orgId}/api-keys`, payload).then(r => r.data)
export const revokeApiKey   = (orgId, keyId)   => http.delete(`/organizations/${orgId}/api-keys/${keyId}`)
export const toggleApiKey   = (orgId, keyId)   => http.patch(`/organizations/${orgId}/api-keys/${keyId}/toggle`).then(r => r.data)
export const getApiKeyUsage = (orgId)          => http.get(`/organizations/${orgId}/api-keys/usage`).then(r => r.data)

// ── Org users (admin view via /users/search with orgId filter) ─
export const getUsersByOrg = (orgId) =>
  http.get('/users/search', { params: { q: '', orgId } }).then(r => r.data)
