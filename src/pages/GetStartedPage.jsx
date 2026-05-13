import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitOnboardingRequest } from '../services/api'

/* ─── Feature options ────────────────────────────────────────────────────── */
const FEATURES = [
  {
    key: 'PDF_TEMPLATES',
    label: 'PDF Templates',
    desc: 'Drag-and-drop PDF builder with starter gallery, placeholders and version history.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    key: 'EMAIL_TEMPLATES',
    label: 'Email Templates',
    desc: 'Visual email designer with Resend integration, placeholders and delivery audit trail.',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    key: 'E_SIGN',
    label: 'E-Sign',
    desc: 'Collect legally binding digital signatures — send, track, and download completed PDFs.',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    color: '#0d9488',
    bg: '#f0fdfa',
  },
]

const STEPS = ['Contact', 'Organization', 'Features', 'Review']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < current  ? 'bg-indigo-600 text-white'
              : i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
              : 'bg-gray-100 text-gray-400'}`}>
              {i < current
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                : i + 1}
            </div>
            <span className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap
              ${i <= current ? 'text-indigo-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-1 transition-all
              ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const inputCls = `w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all`

export default function GetStartedPage() {
  const navigate = useNavigate()
  const [step,        setStep]        = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState(null)

  const [form, setForm] = useState({
    applicantName:    '',
    applicantEmail:   '',
    organizationName: '',
    description:      '',
    address:          '',
    state:            '',
    region:           '',
    country:          '',
    requestedFeatures: [],
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleFeature = (key) => {
    setForm(f => ({
      ...f,
      requestedFeatures: f.requestedFeatures.includes(key)
        ? f.requestedFeatures.filter(k => k !== key)
        : [...f.requestedFeatures, key],
    }))
  }

  /* ── Validation per step ── */
  const canAdvance = () => {
    if (step === 0) return form.applicantName.trim() && form.applicantEmail.trim() && /\S+@\S+\.\S+/.test(form.applicantEmail)
    if (step === 1) return form.organizationName.trim() && form.country.trim()
    if (step === 2) return form.requestedFeatures.length > 0
    return true
  }

  const next = () => { if (canAdvance()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await submitOnboardingRequest(form)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Thank you, <strong>{form.applicantName}</strong>! We've received your application for
            <strong> {form.organizationName}</strong>.
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            A confirmation email has been sent to <strong>{form.applicantEmail}</strong>.
            Our team will review your application and get back to you within 1–2 business days.
          </p>
          <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What happens next?</p>
            {[
              ['📋', 'Our team reviews your details'],
              ['✅', 'You\'ll receive an approval email with a set-password link'],
              ['🚀', 'Log in and access your assigned features immediately'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 mb-2 last:mb-0">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Nav bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 font-extrabold text-gray-900 hover:opacity-70 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">B</span>
            </div>
            Braify
          </button>
          <button onClick={() => navigate('/login')}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Already have an account? <span className="text-indigo-600 font-semibold">Sign in</span>
          </button>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Get started with Braify</h1>
            <p className="text-gray-500 mt-2">Tell us about you and your organisation to request access.</p>
          </div>

          <StepIndicator current={step} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* ── Step 0: Contact ── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Your contact details</h2>
                  <p className="text-sm text-gray-500">You'll become the first admin of your organisation.</p>
                </div>
                <Field label="Full Name" required>
                  <input
                    className={inputCls}
                    placeholder="Jane Smith"
                    value={form.applicantName}
                    onChange={e => set('applicantName', e.target.value)}
                  />
                </Field>
                <Field label="Work Email" required hint="All notifications and your set-password link will be sent here.">
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="jane@company.com"
                    value={form.applicantEmail}
                    onChange={e => set('applicantEmail', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 1: Organisation ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Organisation details</h2>
                  <p className="text-sm text-gray-500">Tell us about the company or team that will use Braify.</p>
                </div>
                <Field label="Organisation Name" required>
                  <input
                    className={inputCls}
                    placeholder="Acme Corporation"
                    value={form.organizationName}
                    onChange={e => set('organizationName', e.target.value)}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="What does your organisation do? (optional)"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className={inputCls}
                    placeholder="123 Main Street"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="State / Province">
                    <input
                      className={inputCls}
                      placeholder="California"
                      value={form.state}
                      onChange={e => set('state', e.target.value)}
                    />
                  </Field>
                  <Field label="Region">
                    <input
                      className={inputCls}
                      placeholder="West Coast"
                      value={form.region}
                      onChange={e => set('region', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Country" required>
                  <input
                    className={inputCls}
                    placeholder="United States"
                    value={form.country}
                    onChange={e => set('country', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Features ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Feature access</h2>
                  <p className="text-sm text-gray-500">Select the modules your organisation needs. You can request all that apply.</p>
                </div>
                <div className="space-y-3">
                  {FEATURES.map(f => {
                    const selected = form.requestedFeatures.includes(f.key)
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggleFeature(f.key)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4
                          ${selected
                            ? 'border-indigo-500 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200'}`}
                        style={selected ? { background: f.bg } : { background: '#fff' }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all`}
                          style={{ background: selected ? f.color : '#f3f4f6' }}>
                          <svg className="w-5 h-5" style={{ color: selected ? '#fff' : '#9ca3af' }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon}/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{f.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                          ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {form.requestedFeatures.length === 0 && (
                  <p className="text-xs text-rose-500 text-center">Please select at least one feature to continue.</p>
                )}
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Review your application</h2>
                  <p className="text-sm text-gray-500">Please confirm everything is correct before submitting.</p>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Name</span><span className="font-medium text-gray-800">{form.applicantName}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Email</span><span className="font-medium text-gray-800">{form.applicantEmail}</span></div>
                  </div>
                </div>

                {/* Organisation */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Organisation</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Name</span><span className="font-medium text-gray-800">{form.organizationName}</span></div>
                    {form.description && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">About</span><span className="font-medium text-gray-800">{form.description}</span></div>}
                    {form.address  && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Address</span><span className="font-medium text-gray-800">{form.address}</span></div>}
                    {form.state    && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">State</span><span className="font-medium text-gray-800">{form.state}</span></div>}
                    {form.region   && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Region</span><span className="font-medium text-gray-800">{form.region}</span></div>}
                    {form.country  && <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Country</span><span className="font-medium text-gray-800">{form.country}</span></div>}
                  </div>
                </div>

                {/* Features */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Features Requested</p>
                  <div className="flex flex-wrap gap-2">
                    {form.requestedFeatures.map(key => {
                      const f = FEATURES.find(x => x.key === key)
                      return (
                        <span key={key} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ background: f?.bg, color: f?.color }}>
                          {f?.label || key}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button onClick={back}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
              ) : (
                <button onClick={() => navigate('/')}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                  ← Home
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!canAdvance()}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl
                             hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl
                             hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {loading ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By submitting, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-600">Terms of Service</a>{' '}and{' '}
            <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
