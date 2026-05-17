import { useRef } from 'react'

/**
 * Logo uploader — reads the selected file as a base64 data-URL and
 * passes it back via onLogoChange.  Mirrors the avatar upload pattern
 * in ProfilePage but sized for org logos (wider, shorter).
 *
 * @param {string|null} currentLogo  - existing base64 data-URL or null
 * @param {Function}    onLogoChange - called with the new data-URL string
 * @param {string}      label        - field label shown above
 */
export default function LogoUpload({ currentLogo, onLogoChange, label = 'Organisation Logo' }) {
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => onLogoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-4 mt-1">
        {/* Preview box */}
        <div
          className="w-40 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700
                     flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0"
        >
          {currentLogo ? (
            <img src={currentLogo} alt="Logo preview" className="max-h-14 max-w-[152px] object-contain"/>
          ) : (
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                       text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
          >
            {currentLogo ? 'Change logo' : 'Upload logo'}
          </button>
          {currentLogo && (
            <button
              type="button"
              onClick={() => onLogoChange(null)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          )}
          <p className="text-[10px] text-gray-400">PNG, JPG or SVG · max 2 MB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
