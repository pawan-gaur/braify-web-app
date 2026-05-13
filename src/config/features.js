/**
 * Platform feature definitions.
 * Add new features here — they automatically appear in the
 * OrganizationsPage feature-assignment UI and everywhere else.
 */

export const FEATURES = {
  PDF_TEMPLATES:   'PDF_TEMPLATES',
  EMAIL_TEMPLATES: 'EMAIL_TEMPLATES',
  E_SIGN:          'E_SIGN',
}

export const FEATURE_META = {
  PDF_TEMPLATES: {
    key:         'PDF_TEMPLATES',
    label:       'PDF Templates',
    description: 'Design, build and generate PDF documents from reusable drag-and-drop templates.',
    icon:        '📄',
    color:       '#4f46e5',
    bg:          '#eef2ff',
    routes:      ['/templates', '/builder', '/generate'],
  },
  EMAIL_TEMPLATES: {
    key:         'EMAIL_TEMPLATES',
    label:       'Email Templates',
    description: 'Create beautifully branded email templates with a drag-and-drop editor.',
    icon:        '✉️',
    color:       '#0891b2',
    bg:          '#ecfeff',
    routes:      ['/email-templates', '/email-builder'],
  },
  E_SIGN: {
    key:         'E_SIGN',
    label:       'E-Sign',
    description: 'Send documents for electronic signature with a full audit trail.',
    icon:        '✍️',
    color:       '#059669',
    bg:          '#ecfdf5',
    routes:      ['/esign'],
  },
}

/** Ordered list of all features for consistent display. */
export const ALL_FEATURES = [
  FEATURE_META.PDF_TEMPLATES,
  FEATURE_META.EMAIL_TEMPLATES,
  FEATURE_META.E_SIGN,
]
