import { useState, useEffect } from 'react'

/**
 * A combined colour-picker + hex-text-input component.
 * - Native <input type="color"> for visual selection
 * - Hex text field synced bi-directionally
 * - Validates #rrggbb format before calling onChange
 *
 * @param {string}   value     - current hex colour, e.g. "#6366f1"
 * @param {Function} onChange  - called with valid hex string
 * @param {string}   label     - field label shown above
 */
export default function ColorPicker({ value = '#6366f1', onChange, label = 'Primary Colour' }) {
  const [text, setText] = useState(value || '#6366f1')

  // Keep local text in sync when parent value changes
  useEffect(() => {
    if (value && value !== text) setText(value)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const isValidHex = (v) => /^#[0-9A-Fa-f]{6}$/.test(v)

  const handleTextChange = (e) => {
    let v = e.target.value.trim()
    if (v && !v.startsWith('#')) v = '#' + v
    setText(v)
    if (isValidHex(v)) onChange(v)
  }

  const handlePickerChange = (e) => {
    const v = e.target.value
    setText(v)
    onChange(v)
  }

  const safeColor = isValidHex(text) ? text : (isValidHex(value) ? value : '#6366f1')

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        {/* Native colour wheel */}
        <label
          className="w-10 h-10 rounded-xl border-2 border-ink-7 dark:border-gray-700
                     cursor-pointer overflow-hidden shrink-0 shadow-sm hover:shadow transition-shadow"
          title="Click to pick a colour"
        >
          <input
            type="color"
            value={safeColor}
            onChange={handlePickerChange}
            className="opacity-0 w-0 h-0 absolute"
          />
          <div className="w-full h-full rounded-xl" style={{ background: safeColor }} />
        </label>

        {/* Hex text input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          maxLength={7}
          placeholder="#6366f1"
          className={`form-input font-mono uppercase w-32
            ${!isValidHex(text) ? 'border-red-300 dark:border-red-600 focus:ring-red-400' : ''}`}
        />

        {/* Live swatch */}
        <div
          className="h-8 flex-1 rounded-lg shadow-inner border border-black/10"
          style={{ background: safeColor }}
          title={safeColor}
        />
      </div>
      {!isValidHex(text) && (
        <p className="text-[11px] text-red-500 mt-1">Enter a valid hex colour (e.g. #6366f1)</p>
      )}
    </div>
  )
}
