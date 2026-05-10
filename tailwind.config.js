/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',  // indigo-500
          hover:   '#4f46e5',  // indigo-600
          light:   '#eef2ff',  // indigo-50
          dark:    '#3730a3',  // indigo-800
        },
        violet: {
          DEFAULT: '#8b5cf6',
          dark:    '#7c3aed',
        },
        sidebar: {
          DEFAULT: '#0d0d1a',  // near-black purple tint
          hover:   '#14142a',
          border:  '#1c1c35',
          label:   '#4a4a75',
          muted:   '#7070a0',
        },
        surface: {
          DEFAULT: '#f5f7ff',  // light indigo-tinted page bg
          card:    '#ffffff',
          border:  '#e8eaf5',
        },
        navy: '#0f172a',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-sidebar-active': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-card': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
      boxShadow: {
        card:          '0 1px 3px rgba(99,102,241,0.06), 0 4px 16px rgba(99,102,241,0.05)',
        'card-hover':  '0 4px 12px rgba(99,102,241,0.15), 0 16px 40px rgba(139,92,246,0.12)',
        glow:          '0 0 20px rgba(99,102,241,0.35)',
        'glow-sm':     '0 0 10px rgba(99,102,241,0.25)',
        sidebar:       '4px 0 20px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
