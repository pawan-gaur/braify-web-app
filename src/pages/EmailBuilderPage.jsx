import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EmailTemplateBuilder from '../components/builder/EmailTemplateBuilder'
import { getEmailTemplate, createEmailTemplate, updateEmailTemplate } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

export default function EmailBuilderPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()
  const isEdit   = Boolean(id)

  const [template,    setTemplate]    = useState(null)
  const [loading,     setLoading]     = useState(isEdit)
  const [saving,      setSaving]      = useState(false)
  const [fatalError,  setFatalError]  = useState(null)

  const pageTitle = isEdit
    ? (template ? `Edit – ${template.name}` : 'Edit Email')
    : 'New Email Template'
  useDocumentTitle(pageTitle)

  const crumbs = [
    { label: 'Dashboard',       to: '/' },
    { label: 'Email Templates', to: '/email-templates' },
    { label: pageTitle },
  ]

  useEffect(() => {
    if (!isEdit) return
    getEmailTemplate(id)
      .then(setTemplate)
      .catch(err => setFatalError(err.message || 'Email template not found.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (isEdit) {
        await updateEmailTemplate(id, payload)
        toast.success('Email template saved.')
      } else {
        const created = await createEmailTemplate(payload)
        toast.success('Email template created.')
        navigate(`/email-builder/${created.id}`, { replace: true })
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save email template.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center px-4 h-9 bg-sidebar border-b border-sidebar-border shrink-0">
          <Breadcrumbs items={crumbs} dark />
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-92px)] text-gray-400 gap-3">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading email template…
        </div>
      </div>
    )
  }

  /* Fatal load error */
  if (fatalError) {
    return (
      <div className="p-8 max-w-md">
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                        dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {fatalError}
        </div>
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/email-templates')}>
          ← Back to Email Templates
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-4 h-9 bg-sidebar border-b border-sidebar-border shrink-0">
        <Breadcrumbs items={crumbs} dark />
      </div>
      <EmailTemplateBuilder
        initialTemplate={template}
        onSave={handleSave}
        isSaving={saving}
      />
    </div>
  )
}
