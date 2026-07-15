import { useMemo, useRef, useState, useId } from 'react'

/**
 * Email input with recipient autocomplete. Filters a prefetched contact list locally
 * (no network on keystroke), so suggestions appear instantly on the first/second letter.
 *
 * Props:
 *  - value, onChange(value)     controlled email text
 *  - onSelect({name, email})    called when a suggestion is chosen
 *  - contacts                   [{ name, email, useCount }] prefetched org address book
 *  - className, placeholder, name
 */
const MAX_SUGGESTIONS = 7

function rank(contact, q) {
  const email = (contact.email || '').toLowerCase()
  const name  = (contact.name  || '').toLowerCase()
  if (email.startsWith(q)) return 0          // best: email prefix
  if (name.startsWith(q))  return 1          // name prefix
  if (email.includes(q))   return 2          // email substring
  if (name.includes(q))    return 3          // name substring
  return 99
}

export default function EmailAutocomplete({
  value = '',
  onChange,
  onSelect,
  contacts = [],
  className = '',
  placeholder = 'email@company.com',
  name,
}) {
  const [open, setOpen]           = useState(false)
  const [active, setActive]       = useState(0)
  const blurTimer = useRef(null)
  const listId = useId()

  const q = value.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!q) return []
    return contacts
      .map(c => ({ c, r: rank(c, q) }))
      .filter(x => x.r < 99)
      // Don't suggest a contact whose email is already exactly typed (nothing to complete).
      .filter(x => x.c.email?.toLowerCase() !== q)
      .sort((a, b) => a.r - b.r || (b.c.useCount || 0) - (a.c.useCount || 0))
      .slice(0, MAX_SUGGESTIONS)
      .map(x => x.c)
  }, [contacts, q])

  const showList = open && matches.length > 0

  function choose(contact) {
    onSelect?.(contact)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActive(a => Math.min(a + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      // Only intercept Enter when a suggestion is highlighted, so it doesn't block form submit.
      if (matches[active]) { e.preventDefault(); choose(matches[active]) }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative flex-1">
      <input
        className={className}
        type="email"
        name={name}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange?.(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200
                     dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
          onMouseDown={e => { e.preventDefault(); clearTimeout(blurTimer.current) }}
        >
          {matches.map((c, i) => (
            <li
              key={c.email}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(c)}
              className={`px-3 py-2 cursor-pointer text-sm flex flex-col
                ${i === active ? 'bg-accent-50 dark:bg-accent-900/30' : ''}`}
            >
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {c.name || c.email}
              </span>
              {c.name && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
