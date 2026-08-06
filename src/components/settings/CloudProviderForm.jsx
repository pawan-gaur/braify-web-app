import { useEffect, useState } from 'react'

/**
 * Reusable cloud-storage configuration form. Currently used by the platform-admin
 * default-provider page; self-contained (manages its own state from `initial`).
 *
 * Props: initial, saving, onSave(payload), fallbackNote
 */

const PROVIDERS = [
  { key: 'AWS',   label: 'AWS S3',      short: 'S3', color: '#ff9900' },
  { key: 'AZURE', label: 'Azure Blob',  short: 'AZ', color: '#0078d4' },
  { key: 'GCP',   label: 'GCP Storage', short: 'GCP', color: '#1a73e8' },
]

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2',
  'eu-central-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'sa-east-1', 'ca-central-1', 'af-south-1',
]

const EMPTY = {
  cloud: '', bucket: '', path: '', module: '',
  accessKey: '', secretKey: '', awsRegion: '',
  allowedFileTypes: [], maxUploadSizeMb: '', retentionDays: '', presignedUrlExpiration: '',
}

export default function CloudProviderForm({ initial, saving, onSave, fallbackNote }) {
  const [form, setForm] = useState(EMPTY)
  const [fileTypeInput, setFileTypeInput] = useState('')

  useEffect(() => {
    if (initial && initial.configured) {
      setForm({
        cloud:                  initial.cloud                  || '',
        bucket:                 initial.bucket                 || '',
        path:                   initial.path                   || '',
        module:                 initial.module                 || '',
        accessKey:              '',
        secretKey:              '',
        awsRegion:              initial.awsRegion              || '',
        allowedFileTypes:       initial.allowedFileTypes       || [],
        maxUploadSizeMb:        initial.maxUploadSizeMb        != null ? String(initial.maxUploadSizeMb) : '',
        retentionDays:          initial.retentionDays          != null ? String(initial.retentionDays) : '',
        presignedUrlExpiration: initial.presignedUrlExpiration != null ? String(initial.presignedUrlExpiration) : '',
      })
    }
  }, [initial])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addFileType = (type) => {
    const normalized = type.trim().toLowerCase().replace(/^\./, '')
    if (!normalized || form.allowedFileTypes.includes(normalized)) return
    set('allowedFileTypes', [...form.allowedFileTypes, normalized])
    setFileTypeInput('')
  }
  const removeFileType = (type) => set('allowedFileTypes', form.allowedFileTypes.filter(t => t !== type))
  const onFileTypeKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFileType(fileTypeInput) }
  }

  const buildPayload = () => ({
    cloud:                  form.cloud || null,
    bucket:                 form.bucket || null,
    path:                   form.path || null,
    module:                 form.module || null,
    accessKey:              form.accessKey || null,
    secretKey:              form.secretKey || null,
    awsRegion:              form.awsRegion || null,
    allowedFileTypes:       form.allowedFileTypes.length ? form.allowedFileTypes : null,
    maxUploadSizeMb:        form.maxUploadSizeMb        ? Number(form.maxUploadSizeMb) : null,
    retentionDays:          form.retentionDays          ? Number(form.retentionDays) : null,
    presignedUrlExpiration: form.presignedUrlExpiration ? Number(form.presignedUrlExpiration) : null,
  })

  const isAws = form.cloud === 'AWS' || !form.cloud
  const credLabels = {
    AWS:   { access: 'Access Key ID',        secret: 'Secret Access Key' },
    AZURE: { access: 'Connection String',    secret: 'Secret (unused)' },
    GCP:   { access: 'Service Account JSON',  secret: 'Secret (unused)' },
  }
  const labels = credLabels[form.cloud] || credLabels.AWS

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Credentials are stored securely</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Credentials are encrypted at rest and only displayed in masked form.
              Leave the credential fields blank to keep existing stored values unchanged.
              {fallbackNote ? ' ' + fallbackNote : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Cloud Provider</h2>
            <p className="text-xs text-gray-400 mb-4">Storage backend for uploaded files.</p>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDERS.map(prov => (
                <button key={prov.key} type="button"
                  onClick={() => { set('cloud', prov.key); if (prov.key !== 'AWS') set('awsRegion', '') }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${form.cloud === prov.key
                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md'
                      : 'border-ink-7 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black"
                    style={{ background: prov.color }}>{prov.short}</div>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">{prov.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Credentials</h2>
              <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep the currently stored value.</p>
            </div>
            <div>
              <label className="form-label">{labels.access}</label>
              <input type="password" className="form-input font-mono" autoComplete="new-password"
                placeholder="Paste to replace" value={form.accessKey} onChange={e => set('accessKey', e.target.value)} />
            </div>
            {form.cloud === 'AWS' && (
              <div>
                <label className="form-label">{labels.secret}</label>
                <input type="password" className="form-input font-mono" autoComplete="new-password"
                  placeholder="Paste to replace" value={form.secretKey} onChange={e => set('secretKey', e.target.value)} />
              </div>
            )}
            {isAws && (
              <div>
                <label className="form-label">AWS Region</label>
                <select className="form-input" value={form.awsRegion} onChange={e => set('awsRegion', e.target.value)}>
                  <option value="">— Select region —</option>
                  {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Storage Location</h2>
            <div>
              <label className="form-label">Bucket / Container Name</label>
              <input type="text" className="form-input" placeholder="my-company-documents"
                value={form.bucket} onChange={e => set('bucket', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Path Prefix</label>
                <input type="text" className="form-input" placeholder="org/docs"
                  value={form.path} onChange={e => set('path', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Module</label>
                <input type="text" className="form-input" placeholder="claims"
                  value={form.module} onChange={e => set('module', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Upload Policy</h2>
            <div>
              <label className="form-label">Allowed File Types</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.allowedFileTypes.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-chip bg-ink-8 dark:bg-gray-700/60 text-ink-3 dark:text-gray-300">
                    {t}
                    <button type="button" onClick={() => removeFileType(t)} className="text-ink-4 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <input type="text" className="form-input" placeholder="pdf, jpg, png — press Enter"
                value={fileTypeInput} onChange={e => setFileTypeInput(e.target.value)} onKeyDown={onFileTypeKey} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Max MB</label>
                <input type="number" className="form-input" value={form.maxUploadSizeMb}
                  onChange={e => set('maxUploadSizeMb', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Retention (days)</label>
                <input type="number" className="form-input" value={form.retentionDays}
                  onChange={e => set('retentionDays', e.target.value)} />
              </div>
              <div>
                <label className="form-label">URL expiry (min)</label>
                <input type="number" className="form-input" value={form.presignedUrlExpiration}
                  onChange={e => set('presignedUrlExpiration', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => onSave(buildPayload())} disabled={saving}
          className="btn btn-primary px-8">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
