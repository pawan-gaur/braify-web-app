/** Legal name + postal address + tax ID. Controlled: `value` / `onChange(next)`. */
export default function BillToFields({ value = {}, onChange, nameLabel = 'Legal name', disabled = false, required = false, idPrefix = 'bt' }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  const field = (k, label, opts = {}) => (
    <div className={opts.wide ? 'sm:col-span-2' : ''}>
      <label className="form-label" htmlFor={`${idPrefix}-${k}`}>{label}{opts.req ? ' *' : ''}</label>
      <input id={`${idPrefix}-${k}`} className="form-input" maxLength={opts.max || 200} disabled={disabled}
        value={value?.[k] || ''} onChange={e => set(k, e.target.value)} required={!!opts.req} />
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {field('legalName', nameLabel, { wide: true, req: required })}
      {field('addressLine1', 'Address line 1')}
      {field('addressLine2', 'Address line 2')}
      {field('city', 'City', { max: 100 })}
      {field('state', 'State / region', { max: 100 })}
      {field('postalCode', 'Postal code', { max: 30 })}
      {field('country', 'Country', { max: 100 })}
      {field('taxId', 'Tax ID (VAT / GST / PIN)', { max: 60 })}
    </div>
  )
}
