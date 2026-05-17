import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getBranding, updateBranding } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import LogoUpload from '../components/ui/LogoUpload'
import ColorPicker from '../components/ui/ColorPicker'

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Settings' },
  { label: 'Branding' },
]

const DEFAULT_COLOR = '#6366f1'

export default function BrandingPage() {
  useDocumentTitle('Organisation Branding')
  const { user } = useAuth()
  const toast    = useToast()

  const orgId = user?.organizationId

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const [form, setForm] = useState({
    logoBase64:      null,
    primaryColor:    DEFAULT_COLOR,
    emailSenderName: '',
    emailReplyTo:    '',
    footerText:      '',
  })

  useEffect(() => {
    if (!orgId) return
    getBranding(orgId)
      .then(data => {
        setForm({
          logoBase64:      data.logoBase64      || null,
          primaryColor:    data.primaryColor    || DEFAULT_COLOR,
          emailSenderName: data.emailSenderName || '',
          emailReplyTo:    data.emailReplyTo    || '',
          footerText:      data.footerText      || '',
        })
      })
      .catch(() => {}) // first-time: no branding yet, use defaults
      .finally(() => setLoading(false))
  }, [orgId])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateBranding(orgId, form)
      toast.success('Branding saved successfully.')
    } catch (err) {
      toast.error(err.message || 'Failed to save branding.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading branding…
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Breadcrumbs items={CRUMBS} />

      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Organisation Branding</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customise your logo, colours and email sender details. Changes apply to PDF headers/footers and outgoing emails.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: settings ── */}
        <div className="space-y-7">

          {/* Logo */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Logo</h2>
            <LogoUpload
              currentLogo={form.logoBase64}
              onLogoChange={v => set('logoBase64', v)}
            />
          </div>

          {/* Colours */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Brand Colour</h2>
            <ColorPicker
              value={form.primaryColor}
              onChange={v => set('primaryColor', v)}
              label="Primary Colour"
            />
            <p className="text-[11px] text-gray-400 mt-3">
              Used as the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">--brand-color</code> CSS variable in PDF templates and as the accent colour in outgoing emails.
            </p>
          </div>

          {/* Email sender */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Email Sender</h2>

            <div>
              <label className="form-label">Sender Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Acme Corp"
                value={form.emailSenderName}
                onChange={e => set('emailSenderName', e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="form-label">Reply-To Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="hello@acme.com"
                value={form.emailReplyTo}
                onChange={e => set('emailReplyTo', e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Recipients will reply to this address. Leave blank to use the system default.
              </p>
            </div>
          </div>

          {/* Footer text */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Custom Footer</h2>
            <textarea
              className="form-input resize-none"
              rows={3}
              maxLength={500}
              placeholder="© 2025 Acme Corp · All rights reserved · acme.com"
              value={form.footerText}
              onChange={e => set('footerText', e.target.value)}
            />
            <p className="text-[10px] text-gray-400 text-right mt-1">{form.footerText.length}/500</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Appended to every generated PDF as a footer line. HTML is not supported.
            </p>
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setForm({ logoBase64: null, primaryColor: DEFAULT_COLOR, emailSenderName: '', emailReplyTo: '', footerText: '' })
                toast.info('Branding reset to defaults (not yet saved).')
              }}
              className="btn btn-secondary"
            >
              Reset
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Branding'}
            </button>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Live Preview</h2>

          {/* PDF header preview */}
          <div className="card p-0 overflow-hidden">
            <div
              className="px-5 py-4 flex items-center gap-4"
              style={{ borderBottom: `3px solid ${form.primaryColor}` }}
            >
              {form.logoBase64 ? (
                <img src={form.logoBase64} alt="Logo" className="h-10 max-w-[120px] object-contain shrink-0" />
              ) : (
                <div className="w-16 h-10 rounded border-2 border-dashed border-gray-200 dark:border-gray-600
                                flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Document Title</p>
                <p className="text-xs text-gray-400">Generated {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Fake content */}
            <div className="px-5 py-4 space-y-2">
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full" />
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400 text-center">
                {form.footerText || '© Your Organisation · All rights reserved'}
              </p>
            </div>
          </div>

          {/* Email preview */}
          <div className="card overflow-hidden">
            {/* Email header bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: form.primaryColor }}
            />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                {form.logoBase64 ? (
                  <img src={form.logoBase64} alt="Logo" className="h-8 max-w-[100px] object-contain" />
                ) : (
                  <div className="w-12 h-8 rounded border-2 border-dashed border-gray-200 dark:border-gray-600
                                  flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    From: {form.emailSenderName || 'Your Organisation'}
                  </p>
                  {form.emailReplyTo && (
                    <p className="text-[10px] text-gray-400">Reply-to: {form.emailReplyTo}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-4/5" />
              </div>

              {/* CTA button preview */}
              <div
                className="inline-block text-xs font-bold text-white px-4 py-2 rounded-lg"
                style={{ background: form.primaryColor }}
              >
                View Document
              </div>

              <p className="text-[10px] text-gray-400 mt-4 text-center">
                {form.footerText || '© Your Organisation · All rights reserved'}
              </p>
            </div>
          </div>

          {/* Color swatch */}
          <div className="card p-4 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0"
              style={{ background: form.primaryColor }}
            />
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Brand Colour</p>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 uppercase">{form.primaryColor}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                This colour is injected as <code className="bg-gray-100 dark:bg-gray-700 px-0.5 rounded">--brand-color</code> in PDF templates.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
