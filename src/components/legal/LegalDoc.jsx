/**
 * Shared shell for public legal pages (Privacy, Terms).
 * Renders a prominent DRAFT banner — these are templates pending legal review, not final text.
 */
import { Link } from 'react-router-dom'

export function Section({ heading, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
      <div className="mt-2 space-y-2 text-sm text-gray-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mt-1">
        {children}
      </div>
    </section>
  )
}

export default function LegalDoc({ title, children }) {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900">Braify</Link>
          <Link to="/trust" className="text-sm text-accent-600 hover:underline">Trust Center</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Template notice — remove only once counsel has finalised and adopted the text. */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Template for legal review.</strong> This document is provided as a professionally
          structured starting point and does not constitute legal advice. Bracketed fields
          (e.g. <em>[Braify Legal Entity]</em>, <em>[Governing Law]</em>) must be completed, and the
          text reviewed and adopted, by qualified counsel before it is published or relied upon.
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-xs text-gray-400">Effective date: [date] · Version: [x.y] (draft for review)</p>

        {children}
      </main>

      <footer className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6 text-xs text-gray-400">© {new Date().getFullYear()} Braify.</div>
      </footer>
    </div>
  )
}
