/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.022em',
        tight:    '-0.014em',
      },
      colors: {
        /* ── NEW: Apple-inspired primary palette ────────────────────────── */
        brand: {
          DEFAULT: '#0066FF',
          hover:   '#0047B3',
          light:   '#E6F0FF',
          dark:    '#003580',
          50:      '#F0F6FF',
          100:     '#E6F0FF',
          200:     '#BFD9FF',
          300:     '#80B3FF',
          400:     '#338BFF',
          500:     '#0066FF',
          600:     '#0052CC',
          700:     '#003D99',
          800:     '#002966',
          900:     '#001433',
        },

        /* ── NEW: Apple-precise grayscale ───────────────────────────────── */
        ink: {
          DEFAULT: '#1D1D1F',  // Apple title color
          2:       '#424245',
          3:       '#6E6E73',  // Apple secondary text
          4:       '#86868B',
          5:       '#A1A1A6',
          6:       '#D2D2D7',
          7:       '#E5E5E7',  // Apple hairline border
          8:       '#F5F5F7',  // Apple light surface
          9:       '#FAFAFA',  // Page background
        },

        /* ── NEW: iOS semantic colors ───────────────────────────────────── */
        success: '#34C759',
        danger:  '#FF3B30',
        warning: '#FF9500',
        info:    '#5AC8FA',

        /* ── BACKWARD COMPAT (keep existing pages working) ──────────────── */
        primary: {
          DEFAULT: '#0066FF',   // remap to brand
          hover:   '#0047B3',
          light:   '#E6F0FF',
          dark:    '#003580',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          dark:    '#7c3aed',
        },
        sidebar: {
          DEFAULT: '#1D1D1F',   // graphite (was dark purple)
          hover:   '#2C2C2E',
          border:  '#38383A',
          label:   '#6E6E73',
          muted:   '#86868B',
        },
        surface: {
          DEFAULT: '#FAFAFA',   // cleaner than indigo-tinted
          card:    '#FFFFFF',
          border:  '#E5E5E7',   // Apple hairline
        },
        navy: '#1D1D1F',
      },

      backgroundImage: {
        /* New brand-aligned gradients (subtle) */
        'gradient-brand':        'linear-gradient(135deg, #0066FF 0%, #338BFF 100%)',
        'gradient-brand-hover':  'linear-gradient(135deg, #0052CC 0%, #0066FF 100%)',
        'gradient-glass':        'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',

        /* Backward-compat aliases */
        'gradient-primary':         'linear-gradient(135deg, #0066FF 0%, #338BFF 100%)',
        'gradient-primary-hover':   'linear-gradient(135deg, #0052CC 0%, #0066FF 100%)',
        'gradient-sidebar-active':  'linear-gradient(135deg, #0066FF 0%, #338BFF 100%)',
        'gradient-card':            'linear-gradient(135deg, #0066FF 0%, #338BFF 100%)',
      },

      borderRadius: {
        chip: '8px',
        input: '12px',
        card: '16px',
        hero: '24px',
      },

      boxShadow: {
        /* Apple-precise elevation */
        soft:        '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        float:       '0 8px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        floatHover:  '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.05)',
        modal:       '0 24px 64px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.06)',
        ring:        '0 0 0 4px rgba(0,102,255,0.15)',

        /* Backward-compat aliases */
        card:          '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        'card-hover':  '0 8px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        glow:          '0 0 0 4px rgba(0,102,255,0.15)',
        'glow-sm':     '0 0 0 3px rgba(0,102,255,0.1)',
        sidebar:       '4px 0 20px rgba(0,0,0,0.2)',
      },

      backdropBlur: {
        xs: '4px',
      },

      transitionTimingFunction: {
        'spring':  'cubic-bezier(0.22, 1, 0.36, 1)',
        'snappy':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },

      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'fade-in-up': 'fade-in-up 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in':   'scale-in 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'shimmer':    'shimmer 1.8s linear infinite',
        'float-bob':  'float-bob 3s ease-in-out infinite',
        'count-up':   'count-up 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
