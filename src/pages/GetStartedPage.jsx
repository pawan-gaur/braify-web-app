import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitOnboardingRequest } from '../services/api'

/* ─── Feature options ────────────────────────────────────────────────────── */
const FEATURES = [
  {
    key: 'PDF_TEMPLATES',
    label: 'PDF Templates',
    desc: 'Drag-and-drop builder, placeholders, and version history.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9v11a2 2 0 01-2 2z',
  },
  {
    key: 'EMAIL_TEMPLATES',
    label: 'Email Templates',
    desc: 'Visual email designer with Resend delivery and audit trail.',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    key: 'E_SIGN',
    label: 'E-Sign',
    desc: 'Legally binding digital signatures — send, track, download.',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
]

const STORAGE_KEY = 'braify.getStarted.v2'

/* ─── 3-step progress bar ────────────────────────────────────────────────── */
function Progress({ step, total }) {
  const pct = ((step + 1) / total) * 100
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-3">
          Step {step + 1} of {total}
        </span>
        <span className="text-xs font-medium text-ink-3">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-ink-7 overflow-hidden">
        <div
          className="h-full bg-brand transition-[width] duration-500 ease-spring"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ─── Email-validation icon ──────────────────────────────────────────────── */
function EmailStatus({ value }) {
  if (!value) return null
  const valid = /\S+@\S+\.\S+/.test(value)
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
      {valid ? (
        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center animate-scale-in">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-ink-6 border-t-brand animate-spin"/>
      )}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function GetStartedPage() {
  const navigate = useNavigate()
  const firstInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [showOptional, setShowOptional] = useState(false)

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      applicantName: '',
      applicantEmail: '',
      organizationName: '',
      description: '',
      address: '',
      state: '',
      region: '',
      country: '',
      requestedFeatures: [],
    }
  })

  /* Persist on every change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  /* Auto-focus first input on step change */
  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [step])

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
    if (step === 0) {
      return (
        form.applicantName.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(form.applicantEmail) &&
        form.organizationName.trim().length >= 2
      )
    }
    if (step === 1) return form.requestedFeatures.length > 0
    return true
  }

  const next = () => { if (canAdvance()) setStep(s => Math.min(s + 1, 2)) }
  const back = () => setStep(s => Math.max(s - 1, 0))

  /* Enter advances on text inputs (but not textarea) */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && canAdvance()) {
      e.preventDefault()
      next()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await submitOnboardingRequest(form)
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ───────────────────────────── SUCCESS ───────────────────────────── */
  if (submitted) {
    return <SuccessScreen form={form} onHome={() => navigate('/')} />
  }

  return (
    <div className="min-h-screen bg-ink-9">
      {/* ── Glass header ───────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-ink-7">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-semibold text-ink hover:opacity-70 transition-opacity"
          >
            <div className="w-7 h-7 rounded-input bg-brand flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            Braify
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-ink-3 hover:text-ink transition-colors"
          >
            Already have an account? <span className="text-brand font-semibold">Sign in</span>
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-xl mx-auto animate-fade-in-up">
          <Progress step={step} total={3} />

          <div className="bg-white rounded-hero border border-ink-7 shadow-soft p-8 md:p-10">

            {/* ═══════════ STEP 0: Identity ═══════════ */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h1 className="display-2">Let's get you set up</h1>
                  <p className="text-ink-3 mt-2 text-[15px]">
                    We'll create your workspace in under a minute.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="form-label">Your name</label>
                    <input
                      ref={firstInputRef}
                      className="form-input-hero"
                      placeholder="Jane Smith"
                      value={form.applicantName}
                      onChange={e => set('applicantName', e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="name"
                    />
                  </div>

                  {/* Work email — with live validation icon */}
                  <div>
                    <label className="form-label">Work email</label>
                    <div className="relative">
                      <input
                        type="email"
                        className="form-input-hero pr-12"
                        placeholder="jane@company.com"
                        value={form.applicantEmail}
                        onChange={e => set('applicantEmail', e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="email"
                      />
                      <EmailStatus value={form.applicantEmail} />
                    </div>
                  </div>

                  {/* Organization name */}
                  <div>
                    <label className="form-label">Organization name</label>
                    <input
                      className="form-input-hero"
                      placeholder="Acme Corporation"
                      value={form.organizationName}
                      onChange={e => set('organizationName', e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="organization"
                    />
                  </div>

                  {/* Collapsed optional fields */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowOptional(s => !s)}
                      className="flex items-center gap-2 text-sm font-medium text-ink-3 hover:text-ink transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-250 ease-spring ${showOptional ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                      {showOptional ? 'Hide optional details' : 'Add optional details'}
                      <span className="text-ink-5">(country, address, description)</span>
                    </button>

                    {showOptional && (
                      <div className="mt-4 space-y-3 animate-fade-in-up">
                        <input
                          className="form-input"
                          placeholder="Country"
                          value={form.country}
                          onChange={e => set('country', e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <input
                          className="form-input"
                          placeholder="Address (optional)"
                          value={form.address}
                          onChange={e => set('address', e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className="form-input"
                            placeholder="State / Province"
                            value={form.state}
                            onChange={e => set('state', e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                          <input
                            className="form-input"
                            placeholder="Region"
                            value={form.region}
                            onChange={e => set('region', e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                        </div>
                        <textarea
                          className="form-input resize-none"
                          rows={2}
                          placeholder="What does your organization do? (optional)"
                          value={form.description}
                          onChange={e => set('description', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 1: Features ═══════════ */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h1 className="display-2">What will you use?</h1>
                  <p className="text-ink-3 mt-2 text-[15px]">
                    Pick the features your team needs. You can change this later.
                  </p>
                </div>

                <div className="space-y-3">
                  {FEATURES.map((f, idx) => {
                    const selected = form.requestedFeatures.includes(f.key)
                    return (
                      <button
                        key={f.key}
                        ref={idx === 0 && step === 1 ? firstInputRef : null}
                        type="button"
                        onClick={() => toggleFeature(f.key)}
                        className={`group w-full text-left p-5 rounded-card border-2 transition-all duration-250 ease-spring flex items-start gap-4
                          ${selected
                            ? 'border-brand bg-brand-50/50 shadow-soft'
                            : 'border-ink-7 hover:border-ink-6 hover:bg-ink-9'}`}
                      >
                        <div className={`w-11 h-11 rounded-input flex items-center justify-center shrink-0 transition-colors
                          ${selected ? 'bg-brand text-white' : 'bg-ink-8 text-ink-3 group-hover:bg-ink-7'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon}/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-[15px]">{f.label}</p>
                          <p className="text-sm text-ink-3 mt-0.5">{f.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                          ${selected ? 'border-brand bg-brand' : 'border-ink-6'}`}>
                          {selected && (
                            <svg className="w-3.5 h-3.5 text-white animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ═══════════ STEP 2: Review ═══════════ */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h1 className="display-2">All set?</h1>
                  <p className="text-ink-3 mt-2 text-[15px]">
                    We'll send you a confirmation email and review your application within 1–2 business days.
                  </p>
                </div>

                <div className="space-y-3">
                  <ReviewRow label="Name" value={form.applicantName} />
                  <ReviewRow label="Email" value={form.applicantEmail} />
                  <ReviewRow label="Organization" value={form.organizationName} />
                  {form.country     && <ReviewRow label="Country"     value={form.country} />}
                  {form.address     && <ReviewRow label="Address"     value={form.address} />}
                  {form.state       && <ReviewRow label="State"       value={form.state} />}
                  {form.region      && <ReviewRow label="Region"      value={form.region} />}
                  {form.description && <ReviewRow label="About"       value={form.description} />}
                  <div className="flex items-start justify-between py-3 border-b border-ink-7">
                    <span className="text-sm text-ink-3 shrink-0 pt-1">Features</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {form.requestedFeatures.map(key => {
                        const f = FEATURES.find(x => x.key === key)
                        return (
                          <span
                            key={key}
                            className="text-xs font-semibold px-2.5 py-1 rounded-chip bg-brand-50 text-brand-700"
                          >
                            {f?.label || key}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error animate-fade-in-up">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════ Navigation ═══════════ */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink-7">
              {step > 0 ? (
                <button
                  onClick={back}
                  className="btn btn-ghost"
                >
                  ← Back
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="text-sm font-medium text-ink-3 hover:text-ink transition-colors"
                >
                  ← Cancel
                </button>
              )}

              {step < 2 ? (
                <button
                  onClick={next}
                  disabled={!canAdvance()}
                  className="btn btn-primary btn-lg gap-2"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn btn-primary btn-lg gap-2"
                >
                  {loading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {loading ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-xs text-ink-5">
              Press <kbd className="kbd">Enter</kbd> to advance · <kbd className="kbd">Esc</kbd> to clear
            </p>
            <p className="text-xs text-ink-5">
              By submitting, you agree to our{' '}
              <a href="#" className="underline hover:text-ink-3">Terms</a>{' '}and{' '}
              <a href="#" className="underline hover:text-ink-3">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Review-screen row ──────────────────────────────────────────────────── */
function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-7">
      <span className="text-sm text-ink-3 shrink-0">{label}</span>
      <span className="text-sm font-medium text-ink text-right truncate ml-4">{value}</span>
    </div>
  )
}

/* ─── Success screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ form, onHome }) {
  const [count, setCount] = useState(8)
  useEffect(() => {
    if (count <= 0) { onHome(); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onHome])

  return (
    <div className="min-h-screen bg-ink-9 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-success/10 animate-float-bob"/>
          <div className="absolute inset-2 rounded-full bg-success flex items-center justify-center shadow-float">
            <svg className="w-10 h-10 text-white animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>

        <h1 className="display-2 mb-3">Application submitted</h1>
        <p className="text-ink-3 leading-relaxed mb-2">
          Thanks, <strong className="text-ink font-semibold">{form.applicantName}</strong>.
          We've received your request for <strong className="text-ink font-semibold">{form.organizationName}</strong>.
        </p>
        <p className="text-sm text-ink-4 mb-10">
          A confirmation email is on its way to <strong className="text-ink-3">{form.applicantEmail}</strong>.
        </p>

        {/* What's next — clean list, no emoji */}
        <div className="bg-white rounded-card border border-ink-7 p-6 text-left mb-10 shadow-soft">
          <p className="text-eyebrow mb-4">What happens next</p>
          <ol className="space-y-3">
            {[
              'Our team reviews your application',
              'You receive an approval email with a set-password link',
              'Sign in and start using your assigned features',
            ].map((text, i) => (
              <li key={text} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-ink-2 leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <button onClick={onHome} className="btn btn-primary btn-lg w-full">
          Back to home
        </button>
        <p className="text-xs text-ink-5 mt-4">
          Redirecting in <span className="tabular-nums font-semibold text-ink-3">{count}</span>s
        </p>
      </div>
    </div>
  )
}
