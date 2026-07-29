/**
 * Public Trust / Security Center.
 *
 * IMPORTANT: This page states the REAL status of each framework. It never claims a
 * certification Braify does not hold. Statuses use honest labels:
 *   - "Supported"      — implemented in the product today
 *   - "Aligned"        — controls in place; formal audit not yet completed
 *   - "In progress"    — actively working toward certification/attestation
 * Update the STATUS values only when the underlying reality changes.
 */
import { Link } from 'react-router-dom'

const STATUS_STYLES = {
  Supported:    'bg-green-100 text-green-700',
  Aligned:      'bg-blue-100 text-blue-700',
  'In progress':'bg-amber-100 text-amber-700',
}

function Badge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const FRAMEWORKS = [
  { name: 'ESIGN Act & UETA (US)', status: 'Supported',
    note: 'Explicit electronic-records-&-signatures consent, intent-to-sign attestation, signer attribution, and a tamper-evident audit trail with document hashing.' },
  { name: 'eIDAS (EU)', status: 'Aligned',
    note: 'Simple & advanced electronic signatures with consent, attribution, and integrity verification. Qualified signatures/timestamps (QES) via a Qualified Trust Service Provider are on the roadmap.' },
  { name: 'GDPR', status: 'Aligned',
    note: 'Data-protection controls, tenant isolation, access controls, and audit logging. A Data Processing Agreement (DPA) and sub-processor list are available; data-subject request handling is being formalised.' },
  { name: 'ISO/IEC 27001', status: 'In progress',
    note: 'Technical Annex A controls (access control, cryptography, logging & monitoring) are implemented. Formal ISMS documentation and third-party certification audit are underway.' },
  { name: 'ISO/IEC 27701', status: 'In progress',
    note: 'Privacy Information Management controls, building on ISO 27001. Certification follows the 27001 audit.' },
  { name: 'SOC 2 Type II', status: 'In progress',
    note: 'Security, Availability, and Confidentiality controls are operating. A Type II report requires an independent auditor to observe them over an examination period, which is scheduled.' },
  { name: 'CSA STAR', status: 'In progress',
    note: 'A CAIQ self-assessment mapped to our ISO 27001 / SOC 2 controls is being prepared for the CSA STAR registry.' },
  { name: 'HIPAA', status: 'In progress',
    note: 'Not required for general use of Braify today. Where protected health information (PHI) is in scope, Security-Rule safeguards and a Business Associate Agreement (BAA) are available on request.' },
]

const CONTROLS = [
  { title: 'Encryption', points: [
    'TLS in transit; secure, HTTP-only, SameSite session cookies.',
    'AES-256-GCM encryption of sensitive fields at rest (e.g. MFA secrets, cloud credentials).' ] },
  { title: 'Authentication & access', points: [
    'Policy-enforced multi-factor authentication (TOTP) with one-time recovery codes.',
    'Role-based access control, strong password policy (BCrypt, complexity, reuse & expiry).',
    'Short-lived access tokens with rotating refresh tokens, idle & absolute session timeouts, account lockout.' ] },
  { title: 'Audit & integrity', points: [
    'Immutable, append-only audit log with a SHA-256 hash chain and a daily automated integrity check.',
    'Every action records who, what, when, IP and device.' ] },
  { title: 'Tenant isolation', points: [
    'Each organisation’s data is scoped and segregated at the query layer.',
    'Per-feature authorization and scoped API keys (stored only as hashes).' ] },
  { title: 'E-signature trust', points: [
    'Affirmative electronic-signature consent captured before signing.',
    'Every signed document is SHA-256 hashed and can be independently verified; a full audit report is embedded in the final PDF.' ] },
  { title: 'Operational security', points: [
    'Secrets injected from the environment — never stored in source.',
    'Input validation, structured error handling, restricted management endpoints.' ] },
]

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900">Braify</Link>
          <Link to="/" className="text-sm text-accent-600 hover:underline">← Back to site</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trust & Security</h1>
        <p className="mt-3 text-gray-600 max-w-2xl">
          Security and privacy are built into how Braify handles your documents and data. This page
          summarises the controls in place and our honest status against major frameworks. We state
          only what is true today — where a certification is still in progress, we say so.
        </p>
      </section>

      {/* Frameworks */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance & standards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FRAMEWORKS.map(f => (
            <div key={f.name} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">{f.name}</h3>
                <Badge status={f.status} />
              </div>
              <p className="mt-2 text-sm text-gray-600">{f.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          "Supported" = implemented in the product. "Aligned" = controls in place, formal audit not
          yet completed. "In progress" = actively working toward certification/attestation. Braify
          does not claim certifications it has not been independently awarded.
        </p>
      </section>

      {/* Controls */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONTROLS.map(c => (
            <div key={c.title} className="rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">{c.title}</h3>
              <ul className="mt-2 space-y-1.5">
                {c.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How we operate */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How we operate</h2>
        <div className="space-y-4 text-sm text-gray-600">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Data hosting & residency</h3>
            <p className="mt-1">Braify is hosted on established cloud infrastructure, with the database
              and document storage provided by reputable managed providers. Customer data is logically
              segregated by organization. The hosting regions applicable to your account, and the
              transfer safeguards where data crosses borders, are available on request.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Reliability & continuity</h3>
            <p className="mt-1">Our managed database and storage providers maintain redundancy and
              regular backups of the data they hold. We monitor service health and are formalizing our
              business-continuity and disaster-recovery documentation as part of our compliance program.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Incident response & breach notification</h3>
            <p className="mt-1">We maintain an incident-response process to detect, investigate,
              contain, and remediate security events. In the event of a personal-data breach, we will
              notify affected customers without undue delay and within the timeframes required by
              applicable law and our contracts, and will support customers in meeting their own
              notification obligations.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Access & personnel</h3>
            <p className="mt-1">Access to production systems and customer data is restricted to
              authorized personnel on a least-privilege, need-to-know basis, and is subject to
              authentication controls and audit logging. Personnel are bound by confidentiality
              obligations.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Vendor & sub-processor management</h3>
            <p className="mt-1">We engage sub-processors under written contracts consistent with our
              obligations, review their security posture (including their own SOC 2 / ISO 27001
              reports where available), and maintain a current sub-processor list available to
              customers. We provide advance notice of changes as set out in our Data Processing
              Agreement.</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Responsible disclosure</h3>
            <p className="mt-1">We welcome reports from security researchers. If you believe you have
              found a vulnerability, please contact{' '}
              <a href="mailto:security@braify.com" className="text-accent-600 hover:underline">security@braify.com</a>.
              We ask that you give us a reasonable opportunity to remediate before public disclosure,
              and that testing does not disrupt the Service or access other users' data.</p>
          </div>
        </div>
      </section>

      {/* Documents & contact */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Documents & requests</h2>
        <div className="rounded-xl border border-gray-200 p-5 space-y-2 text-sm text-gray-600">
          <p>The following are available to customers on request: security whitepaper, Data Processing
            Agreement (DPA), sub-processor list, and (where PHI applies) a Business Associate Agreement (BAA).</p>
          <p>Read our <Link to="/privacy" className="text-accent-600 hover:underline">Privacy Policy</Link> and
            {' '}<Link to="/terms" className="text-accent-600 hover:underline">Terms of Service</Link>.</p>
          <p>Report a security concern: <a href="mailto:security@braify.com" className="text-accent-600 hover:underline">security@braify.com</a>
            {' '}(see also <a href="/.well-known/security.txt" className="text-accent-600 hover:underline">/.well-known/security.txt</a>).</p>
        </div>
      </section>

      <footer className="border-t border-gray-100 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Braify. This page reflects current status and is updated as our
          compliance program progresses.
        </div>
      </footer>
    </div>
  )
}
