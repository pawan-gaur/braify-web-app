/**
 * Platform feature definitions.
 * Add new features here — they automatically appear in the
 * OrganizationsPage feature-assignment UI and everywhere else.
 */

export const FEATURES = {
  PDF_TEMPLATES:   'PDF_TEMPLATES',
  EMAIL_TEMPLATES: 'EMAIL_TEMPLATES',
  E_SIGN:          'E_SIGN',
  FILE_STORAGE:    'FILE_STORAGE',
}

export const FEATURE_META = {
  PDF_TEMPLATES: {
    key:         'PDF_TEMPLATES',
    label:       'PDF Templates',
    description: 'Design, build and generate PDF documents from reusable drag-and-drop templates.',
    icon:        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color:       '#4f46e5',
    bg:          '#eef2ff',
    routes:      ['/templates', '/builder', '/generate'],
  },
  EMAIL_TEMPLATES: {
    key:         'EMAIL_TEMPLATES',
    label:       'Email Templates',
    description: 'Create beautifully branded email templates with a drag-and-drop editor.',
    icon:        'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color:       '#0891b2',
    bg:          '#ecfeff',
    routes:      ['/email-templates', '/email-builder'],
  },
  E_SIGN: {
    key:         'E_SIGN',
    label:       'E-Sign',
    description: 'Send documents for electronic signature with a full audit trail.',
    icon:        'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color:       '#059669',
    bg:          '#ecfdf5',
    routes:      ['/esign'],
  },
  FILE_STORAGE: {
    key:         'FILE_STORAGE',
    label:       'File Storage',
    description: 'Upload, organise and securely store files in your connected cloud storage (AWS S3, Azure Blob, or GCP).',
    icon:        'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    color:       '#d97706',
    bg:          '#fffbeb',
    routes:      ['/files'],
  },
}

/** Ordered list of all features for consistent display. */
export const ALL_FEATURES = [
  FEATURE_META.PDF_TEMPLATES,
  FEATURE_META.EMAIL_TEMPLATES,
  FEATURE_META.E_SIGN,
  FEATURE_META.FILE_STORAGE,
]
