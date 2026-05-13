import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import TemplateBuilder from '../components/builder/TemplateBuilder'
import { getTemplate, createTemplate, updateTemplate } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'

export default function BuilderPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const toast        = useToast()
  const isEdit       = Boolean(id)

  // Starter template passed from the Sample Gallery
  const starterTemplate = location.state?.starterTemplate || null

  const [template,  setTemplate]  = useState(starterTemplate)
  const [loading,   setLoading]   = useState(isEdit)
  const [saving,    setSaving]    = useState(false)
  const [fatalError, setFatalError] = useState(null)   // only for "template not found"

  const pageTitle = isEdit
    ? (template ? `Edit – ${template.name}` : 'Edit PDF Template')
    : (starterTemplate ? `New – ${starterTemplate.name}` : 'New PDF Template')
  useDocumentTitle(pageTitle)

  const crumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'PDF Templates', to: '/templates' },
    { label: pageTitle },
  ]

  useEffect(() => {
    if (!isEdit) return
    getTemplate(id)
      .then(setTemplate)
      .catch(err => setFatalError(err.message || 'Template not found.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (isEdit) {
        await updateTemplate(id, payload)
        toast.success('Template saved successfully.')
      } else {
        const created = await createTemplate(payload)
        toast.success('Template created.')
        navigate(`/builder/${created.id}`, { replace: true })
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save template.')
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
          Loading template…
        </div>
      </div>
    )
  }

  /* Fatal load error — show inline since the whole page is unusable */
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
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/templates')}>
          ← Back to Templates
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center px-4 h-9 bg-sidebar border-b border-sidebar-border shrink-0">
        <Breadcrumbs items={crumbs} dark />
      </div>
      <TemplateBuilder
        initialTemplate={template}
        onSave={handleSave}
        isSaving={saving}
      />
    </div>
  )
}
