import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth, ROLES } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  listFiles, listAllFiles, uploadFile, getFileDownloadUrl, deleteFile, getOrganizations,
} from '../services/api'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import ViewToggle, { useView } from '../components/ui/ViewToggle'

// ── Constants ─────────────────────────────────────────────────────────────────

const CRUMBS = [
  { label: 'Dashboard', to: '/' },
  { label: 'File Storage' },
]

const DOC_TYPES = [
  'CONTRACT', 'INVOICE', 'REPORT', 'RECEIPT', 'CERTIFICATE',
  'IDENTITY', 'POLICY', 'AGREEMENT', 'PRESENTATION', 'SPREADSHEET',
  'IMAGE', 'VIDEO', 'AUDIO', 'OTHER',
]

const STATUS_COLORS = {
  ACTIVE:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  ARCHIVED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  DELETED:  'bg-red-100  text-red-600  dark:bg-red-900/40  dark:text-red-300',
}

const CLOUD_COLORS = {
  AWS:   'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  AZURE: 'bg-blue-50   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  GCP:   'bg-green-50  text-green-700  dark:bg-green-900/30  dark:text-green-300',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)          return `${bytes} B`
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fmtMb(mb) {
  if (mb == null) return '—'
  if (mb < 1)     return `${(mb * 1024).toFixed(0)} KB`
  if (mb < 1024)  return `${mb.toFixed(2)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function titleCase(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function fileIconColor(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? ''
  if (['pdf'].includes(ext))                                    return 'text-red-500'
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext))    return 'text-blue-500'
  if (['doc','docx'].includes(ext))                             return 'text-indigo-500'
  if (['xls','xlsx','csv'].includes(ext))                       return 'text-green-500'
  if (['zip','rar','7z'].includes(ext))                         return 'text-yellow-500'
  if (['mp4','mov','avi','mkv'].includes(ext))                  return 'text-pink-500'
  if (['mp3','wav','ogg'].includes(ext))                        return 'text-purple-500'
  return 'text-gray-400'
}

// ── File Icon ─────────────────────────────────────────────────────────────────

function FileIcon({ filename, className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} ${fileIconColor(filename)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  )
}

// ── Upload Success Panel ──────────────────────────────────────────────────────

function UploadSuccess({ result, onDone }) {
  const rows = [
    { label: 'File ID',     value: result.fileId,           mono: true              },
    { label: 'Filename',    value: result.originalFilename                           },
    { label: 'Size',        value: fmtBytes(result.fileSizeBytes)                   },
    { label: 'Type',        value: titleCase(result.documentType)                   },
    { label: 'Cloud',       value: result.cloudProvider                             },
    { label: 'Bucket',      value: result.bucket                                    },
    { label: 'Storage key', value: result.storageKey, mono: true, truncate: true   },
    { label: 'Folder',      value: result.folder || '—'                             },
    { label: 'Status',      value: result.status                                    },
    { label: 'Uploaded',    value: fmtDate(result.createdAt)                        },
  ]

  return (
    <div className="p-6">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upload successful!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your file has been stored in the cloud.</p>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
        {rows.filter(r => r.value).map((row, i) => (
          <div key={row.label}
            className={`flex items-start gap-3 px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-800'}`}>
            <span className="w-28 flex-shrink-0 text-gray-500 dark:text-gray-400 font-medium">{row.label}</span>
            <span className={`flex-1 text-gray-800 dark:text-gray-200 break-all ${row.mono ? 'font-mono text-xs' : ''} ${row.truncate ? 'truncate' : ''}`}
              title={row.truncate ? row.value : undefined}>
              {row.value}
            </span>
          </div>
        ))}
        {result.tags?.length > 0 && (
          <div className={`flex items-start gap-3 px-4 py-2.5 text-sm ${rows.length % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-800'}`}>
            <span className="w-28 flex-shrink-0 text-gray-500 dark:text-gray-400 font-medium">Tags</span>
            <div className="flex flex-wrap gap-1">
              {result.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={onDone}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
        Done — View in list
      </button>
    </div>
  )
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ orgId, onClose, onUploaded }) {
  const { addToast } = useToast()
  const [file,     setFile]     = useState(null)
  const [meta,     setMeta]     = useState({ folder: '', documentType: 'OTHER', description: '', tags: '' })
  const [loading,  setLoading]  = useState(false)
  const [uploaded, setUploaded] = useState(null)
  const inputRef = useRef()

  const handleDrop = useCallback(e => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) setFile(f)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return addToast({ type: 'error', message: 'Please select a file.' })
    setLoading(true)
    try {
      const tags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const result = await uploadFile(orgId, file, { ...meta, tags })
      setUploaded(result)
      onUploaded()
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {uploaded ? 'Upload Complete' : 'Upload File'}
          </h2>
          <button onClick={uploaded ? onClose : onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {uploaded ? (
          <UploadSuccess result={uploaded} onDone={onClose} />
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
              <input ref={inputRef} type="file" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="text-center">
                  <FileIcon filename={file.name} className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{fmtBytes(file.size)}</p>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Drag &amp; drop or click to select</p>
                  <p className="text-xs text-gray-400 mt-1">Any file type · max size set by your cloud config</p>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
              <select value={meta.documentType} onChange={e => setMeta(m => ({ ...m, documentType: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                {DOC_TYPES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input type="text" placeholder="e.g. invoices/2026" value={meta.folder}
                onChange={e => setMeta(m => ({ ...m, folder: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input type="text" placeholder="Short description" value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags <span className="font-normal text-gray-400">(comma-separated, optional)</span>
              </label>
              <input type="text" placeholder="e.g. legal, Q1-2026, hr" value={meta.tags}
                onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !file}
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {loading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── File Card (Grid view) ─────────────────────────────────────────────────────

function FileCard({ file, onDownload, onDelete, showOrg }) {
  const [dlLoading, setDlLoading] = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  async function handleDownload() {
    setDlLoading(true)
    try { await onDownload(file.fileId, file.organizationId) } finally { setDlLoading(false) }
  }
  async function handleDelete() {
    if (!confirm(`Delete "${file.originalFilename}"?\nThis cannot be undone.`)) return
    setDeleting(true)
    try { await onDelete(file.fileId, file.organizationId) } finally { setDeleting(false) }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
          <FileIcon filename={file.originalFilename} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={file.originalFilename}>
            {file.originalFilename}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fmtBytes(file.fileSizeBytes)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[file.status] ?? STATUS_COLORS.ACTIVE}`}>{file.status}</span>
        {file.cloudProvider && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLOUD_COLORS[file.cloudProvider] ?? 'bg-gray-100 text-gray-600'}`}>{file.cloudProvider}</span>
        )}
        {file.documentType && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {titleCase(file.documentType)}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-1">
        {showOrg && file.organizationId && (
          <div className="flex items-center gap-1 truncate">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span className="truncate font-medium text-indigo-600 dark:text-indigo-400">{file.organizationId}</span>
          </div>
        )}
        {file.folder && (
          <div className="flex items-center gap-1 truncate">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span className="truncate">{file.folder}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>{fmtDate(file.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span className="truncate">{file.uploadedBy}</span>
        </div>
      </div>
      {file.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {file.tags.slice(0, 3).map(t => (
            <span key={t} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">#{t}</span>
          ))}
          {file.tags.length > 3 && <span className="text-xs text-gray-400">+{file.tags.length - 3}</span>}
        </div>
      )}
      <p className="text-xs text-gray-300 dark:text-gray-600 font-mono mb-3 truncate" title={file.fileId}>{file.fileId}</p>
      <div className="flex gap-2 mt-auto">
        {onDownload && (
          <button onClick={handleDownload} disabled={dlLoading}
            className="flex-1 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {dlLoading
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            }
            {dlLoading ? 'Getting…' : 'Download'}
          </button>
        )}
        {onDelete && (
          <button onClick={handleDelete} disabled={deleting} title="Delete"
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ── File Row (List view) ──────────────────────────────────────────────────────

function FileRow({ file, onDownload, onDelete, showOrg, orgNames }) {
  const [dlLoading, setDlLoading] = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  async function handleDownload() {
    setDlLoading(true)
    try { await onDownload(file.fileId, file.organizationId) } finally { setDlLoading(false) }
  }
  async function handleDelete() {
    if (!confirm(`Delete "${file.originalFilename}"?\nThis cannot be undone.`)) return
    setDeleting(true)
    try { await onDelete(file.fileId, file.organizationId) } finally { setDeleting(false) }
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <FileIcon filename={file.originalFilename} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs" title={file.originalFilename}>
              {file.originalFilename}
            </p>
            <p className="text-xs text-gray-400 font-mono truncate max-w-xs" title={file.fileId}>{file.fileId}</p>
          </div>
        </div>
      </td>
      {showOrg && (
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[160px]">
          <p className="truncate font-medium" title={file.organizationId}>
            {orgNames?.[file.organizationId] ?? file.organizationId}
          </p>
        </td>
      )}
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmtBytes(file.fileSizeBytes)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {titleCase(file.documentType)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CLOUD_COLORS[file.cloudProvider] ?? 'bg-gray-100 text-gray-600'}`}>
          {file.cloudProvider}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate" title={file.folder || ''}>
        {file.folder || <span className="text-gray-300 dark:text-gray-600">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate" title={file.uploadedBy}>
        {file.uploadedBy}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(file.createdAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[file.status] ?? STATUS_COLORS.ACTIVE}`}>
          {file.status}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDownload && (
            <button onClick={handleDownload} disabled={dlLoading} title="Download"
              className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50">
              {dlLoading
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              }
            </button>
          )}
          {onDelete && (
            <button onClick={handleDelete} disabled={deleting} title="Delete"
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Shared: Filter bar ────────────────────────────────────────────────────────

function FilterBar({ keyword, onSearch, docType, onDocType, statusFilt, onStatus, sortKey, onSort, extra }) {
  const searchRef = useRef(null)
  function handleSearch(val) {
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => onSearch(val), 400)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
        </svg>
        <input type="text" placeholder="Search name, description or tag…"
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"/>
      </div>
      {extra}
      <select value={docType} onChange={e => onDocType(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
        <option value="">All Types</option>
        {DOC_TYPES.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
      </select>
      <select value={statusFilt} onChange={e => onStatus(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <select value={sortKey} onChange={e => onSort(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
        <option value="createdAt_DESC">Newest first</option>
        <option value="createdAt_ASC">Oldest first</option>
        <option value="originalFilename_ASC">Name A→Z</option>
        <option value="originalFilename_DESC">Name Z→A</option>
        <option value="fileSizeBytes_DESC">Largest first</option>
        <option value="fileSizeBytes_ASC">Smallest first</option>
      </select>
    </div>
  )
}

// ── Shared: Pagination ────────────────────────────────────────────────────────

function Pagination({ data, page, onPage }) {
  if (!data || data.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {data.files.length} of {data.totalElements} files
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page === 0}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Prev
        </button>
        {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
          const pg = Math.max(0, Math.min(page - 3, data.totalPages - 7)) + i
          return (
            <button key={pg} onClick={() => onPage(pg)}
              className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                pg === page
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {pg + 1}
            </button>
          )
        })}
        <button onClick={() => onPage(page + 1)} disabled={data.last}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next →
        </button>
      </div>
    </div>
  )
}

// ── Shared: File content grid/table ──────────────────────────────────────────

function FileContent({ data, view, onDownload, onDelete, showOrg, orgNames }) {
  if (!data || data.files.length === 0) return null

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.files.map(f => (
          <FileCard key={f.fileId} file={f} onDownload={onDownload} onDelete={onDelete} showOrg={showOrg} />
        ))}
      </div>
    )
  }

  const headers = ['File', ...(showOrg ? ['Organisation'] : []), 'Size', 'Type', 'Cloud', 'Folder', 'Uploaded by', 'Date', 'Status', '']
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              {headers.map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.files.map(f => (
              <FileRow key={f.fileId} file={f} onDownload={onDownload} onDelete={onDelete}
                showOrg={showOrg} orgNames={orgNames} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM ADMIN VIEW
// ══════════════════════════════════════════════════════════════════════════════

function AdminFilesView() {
  const { addToast } = useToast()
  const [view, setView]           = useView('files-view-admin', 'table')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [keyword, setKeyword]     = useState('')
  const [docType, setDocType]     = useState('')
  const [statusFilt, setStatusFilt] = useState('')
  const [sortKey, setSortKey]     = useState('createdAt_DESC')
  const [filterOrgId, setFilterOrgId] = useState('')
  const [orgs, setOrgs]           = useState([])        // [{id, name}]
  const [orgNames, setOrgNames]   = useState({})        // {id -> name}
  const [showStats, setShowStats] = useState(true)

  const PAGE_SIZE = 20

  // Load org list once for the filter dropdown
  useEffect(() => {
    getOrganizations()
      .then(res => {
        const list = Array.isArray(res) ? res : (res.content ?? [])
        setOrgs(list)
        const map = {}
        list.forEach(o => { map[o.id] = o.name })
        setOrgNames(map)
      })
      .catch(() => {})
  }, [])

  // Dynamic page title
  useEffect(() => {
    const count = data?.totalActiveFiles != null ? ` (${data.totalActiveFiles})` : ''
    document.title = `File Storage${count} — Braify Admin`
    return () => { document.title = 'Braify' }
  }, [data?.totalActiveFiles])

  const [sortBy, sortDir] = sortKey.split('_')

  const fetchFiles = useCallback(async (pg = 0) => {
    setLoading(true)
    try {
      const params = {
        page: pg, size: PAGE_SIZE, sortBy, sortDir,
        ...(filterOrgId ? { orgId: filterOrgId } : {}),
        ...(keyword      ? { keyword }            : {}),
        ...(docType      ? { documentType: docType } : {}),
        ...(statusFilt   ? { status: statusFilt } : {}),
      }
      const result = await listAllFiles(params)
      setData(result)
      setPage(pg)
    } catch (err) {
      addToast({ type: 'error', message: err.message })
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [filterOrgId, keyword, docType, statusFilt, sortBy, sortDir])

  useEffect(() => { fetchFiles(0) }, [filterOrgId, keyword, docType, statusFilt, sortBy, sortDir])

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Storage</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              Platform Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and monitor files across all organisations. Read-only.
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Global Stats Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Files',    value: data.totalActiveFiles,
              sub: 'active across all orgs', color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Total Storage',  value: fmtMb(data.totalStorageMb),
              sub: 'used by active files',   color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Matching',       value: data.totalElements,
              sub: 'with current filter',    color: 'text-gray-800 dark:text-gray-200' },
            { label: 'Organisations',  value: data.orgStats?.length ?? '—',
              sub: 'with active files',      color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Per-org Storage Breakdown */}
      {data?.orgStats?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Storage Usage by Organisation
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showStats ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showStats && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              {/* Bar chart rows */}
              <div className="px-5 py-4 space-y-3">
                {data.orgStats.map(stat => {
                  const pct = data.totalStorageMb > 0
                    ? Math.round((stat.storageMb / data.totalStorageMb) * 100)
                    : 0
                  return (
                    <div key={stat.orgId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => setFilterOrgId(prev => prev === stat.orgId ? '' : stat.orgId)}
                            className={`text-sm font-medium truncate hover:underline transition-colors ${
                              filterOrgId === stat.orgId
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                            title={`Filter by ${stat.orgName}`}
                          >
                            {stat.orgName}
                          </button>
                          {filterOrgId === stat.orgId && (
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">
                              filtered
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{stat.fileCount} file{stat.fileCount !== 1 ? 's' : ''}</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300 w-20 text-right">{fmtMb(stat.storageMb)}</span>
                          <span className="w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 0.5)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {filterOrgId && (
                <div className="px-5 pb-3">
                  <button onClick={() => setFilterOrgId('')}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
                    ✕ Clear organisation filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        onSearch={setKeyword}
        docType={docType} onDocType={v => { setDocType(v); setPage(0) }}
        statusFilt={statusFilt} onStatus={v => { setStatusFilt(v); setPage(0) }}
        sortKey={sortKey} onSort={v => { setSortKey(v); setPage(0) }}
        extra={
          <select value={filterOrgId} onChange={e => { setFilterOrgId(e.target.value); setPage(0) }}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
            <option value="">All Organisations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        }
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : !data || data.files.length === 0 ? (
        <div className="text-center py-32">
          <svg className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No files found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {keyword || docType || statusFilt || filterOrgId
              ? 'Try adjusting your filters.'
              : 'No files have been uploaded across any organisation yet.'}
          </p>
        </div>
      ) : (
        <FileContent data={data} view={view} showOrg orgNames={orgNames}
          onDownload={null} onDelete={null} />
      )}

      <Pagination data={data} page={page} onPage={fetchFiles} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ORG USER VIEW  (ORG_ADMIN / ORG_USER)
// ══════════════════════════════════════════════════════════════════════════════

function OrgFilesView() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const orgId = user?.organizationId

  const [view, setView]             = useView('files-view', 'table')
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [page, setPage]             = useState(0)
  const [keyword, setKeyword]       = useState('')
  const [docType, setDocType]       = useState('')
  const [statusFilt, setStatusFilt] = useState('')
  const [sortKey, setSortKey]       = useState('createdAt_DESC')

  const PAGE_SIZE = 20
  const [sortBy, sortDir] = sortKey.split('_')

  // Dynamic page title
  useEffect(() => {
    const count = data?.totalActiveFiles != null ? ` (${data.totalActiveFiles})` : ''
    document.title = `File Storage${count} — Braify`
    return () => { document.title = 'Braify' }
  }, [data?.totalActiveFiles])

  const fetchFiles = useCallback(async (pg = 0) => {
    if (!orgId) return
    setLoading(true)
    try {
      const params = {
        page: pg, size: PAGE_SIZE, sortBy, sortDir,
        ...(keyword    ? { keyword }                : {}),
        ...(docType    ? { documentType: docType }  : {}),
        ...(statusFilt ? { status: statusFilt }     : {}),
      }
      const result = await listFiles(orgId, params)
      setData(result)
      setPage(pg)
    } catch (err) {
      if (err.message?.includes('Cloud setup not exists')) {
        addToast({ type: 'warning', message: 'Cloud storage is not configured yet. Go to Settings → Cloud Storage.' })
      } else {
        addToast({ type: 'error', message: err.message })
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [orgId, keyword, docType, statusFilt, sortBy, sortDir])

  useEffect(() => { fetchFiles(0) }, [orgId, keyword, docType, statusFilt, sortBy, sortDir])

  async function handleDownload(fileId, fileOrgId) {
    try {
      const res = await getFileDownloadUrl(fileOrgId ?? orgId, fileId)
      window.open(res.downloadUrl, '_blank', 'noopener')
      addToast({ type: 'success', message: `Download link valid for ${Math.floor(res.expiresInSeconds / 60)} min` })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  async function handleDelete(fileId, fileOrgId) {
    try {
      await deleteFile(fileOrgId ?? orgId, fileId)
      addToast({ type: 'success', message: 'File deleted successfully.' })
      fetchFiles(page)
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <Breadcrumbs items={CRUMBS} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Storage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload and manage files stored in your organisation's cloud storage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Upload File
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Files',   value: data.totalActiveFiles,
              sub: 'active',             color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Total Storage', value: fmtMb(data.totalStorageMb),
              sub: 'used',               color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Matching',      value: data.totalElements,
              sub: 'with current filter', color: 'text-gray-800 dark:text-gray-200' },
            { label: 'Page',          value: `${data.currentPage + 1} / ${Math.max(1, data.totalPages)}`,
              sub: `${PAGE_SIZE} per page`, color: 'text-gray-800 dark:text-gray-200' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        onSearch={setKeyword}
        docType={docType} onDocType={v => { setDocType(v); setPage(0) }}
        statusFilt={statusFilt} onStatus={v => { setStatusFilt(v); setPage(0) }}
        sortKey={sortKey} onSort={v => { setSortKey(v); setPage(0) }}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : !data || data.files.length === 0 ? (
        <div className="text-center py-32">
          <svg className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No files found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {keyword || docType || statusFilt
              ? 'Try adjusting your filters or search query.'
              : 'Upload your first file to get started.'}
          </p>
          {!keyword && !docType && !statusFilt && (
            <button onClick={() => setShowUpload(true)}
              className="mt-5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
              Upload File
            </button>
          )}
        </div>
      ) : (
        <FileContent data={data} view={view} showOrg={false}
          onDownload={handleDownload} onDelete={handleDelete} />
      )}

      <Pagination data={data} page={page} onPage={fetchFiles} />

      {showUpload && (
        <UploadModal orgId={orgId} onClose={() => setShowUpload(false)}
          onUploaded={() => fetchFiles(0)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — dispatches to Admin or Org view based on role
// ══════════════════════════════════════════════════════════════════════════════

export default function FilesPage() {
  const { user } = useAuth()
  return user?.role === ROLES.PLATFORM_ADMIN
    ? <AdminFilesView />
    : <OrgFilesView />
}
