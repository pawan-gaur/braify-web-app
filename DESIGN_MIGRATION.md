# Braify UI Revamp — Migration Guide

Direction: **bento / pastel-gradient / glass**, single brand-blue + violet accent, Inter Tight.
The foundation already exists in `tailwind.config.js` + `src/styles/global.css` and the Dashboard
is fully migrated as the reference. This guide rolls the same language across the rest of the app.

## ⛔ Hard rules
- **Presentational only.** Change `className` strings and small presentational wrappers/icon tiles ONLY.
  Do **not** touch logic, state, hooks, props, data flow, routing, API calls, or text copy.
- **Do not modify** `tailwind.config.js` or `src/styles/global.css` (already done).
- **Do not run** a build or dev server.
- Keep every feature working identically. When unsure, prefer the smaller change.

## Tokens & utilities you may use
- Accent: `brand-*` (blue, 50–900 + DEFAULT/hover/light/dark), `accent-*` (violet, 50–700 + DEFAULT).
- Gradients: `bg-gradient-accent` (blue→violet), `.text-gradient` (gradient text), `.surface-accent` (gradient card w/ white text).
- Grays (Apple "ink" ramp): `text-ink` (title), `text-ink-2`, `text-ink-3` (secondary), `text-ink-4` (muted),
  `border-ink-7` (hairline), `bg-ink-8` (light surface), `bg-ink-9`.
- Surfaces: `.card` (white bento card — 18px radius, soft shadow, hairline border), `.card-hover`,
  `.bento`, `.bento-hover`, pastel `.bento-violet|blue|peach|mint`, `.glass`, `.glass-mini`.
- Buttons: `.btn .btn-primary` (solid brand), `.btn .btn-accent` (blue→violet gradient),
  `.btn .btn-outline`, `.btn .btn-ghost`, plus `.btn-sm` / `.btn-lg`.
- Badges: `.badge .badge-brand|success|warning|danger|gray`.
- Page background is applied globally (`app-wash` on `<main>`). **Do not add page backgrounds.**

## Rules (apply in order)

### 1. Accent sweep — DETERMINISTIC, do all
In className strings, remap the old accent to the new one (keep the numeric shade):
- `indigo-` → `brand-`   (text/bg/border/ring/from/to/via — every variant)
- `purple-` → `accent-`
- `violet-` → `accent-`
- Bare (no shade), e.g. `text-indigo-500` → `text-brand`; `bg-violet-500` → `bg-accent`.
- If a shade doesn't exist in the target (accent has no 800/900), use the nearest that does.
- Hardcoded hex (in `style={}` or color props): `#6366f1|#818cf8|#4f46e5|#4338ca|#3b82f6(as primary)` → `#2F5BF0`;
  `#8b5cf6|#7c3aed|#a78bfa` → `#6D52E8`.
- **Keep all semantic colors as-is**: emerald/green (success), amber/orange/yellow (warning),
  rose/red (danger), sky/teal/cyan, and `blue-*` when it's a status/info color. Only convert `blue-*`
  if it is clearly acting as the PRIMARY accent (e.g. a primary CTA `bg-blue-600 text-white`).

### 2. Primary CTAs
The main action button on a page/modal → `btn btn-primary` (or `btn btn-accent` for hero/marketing).
Convert ad-hoc colored buttons (`bg-indigo-600 text-white px-4 py-2 rounded-lg ...`) to the button classes.
Secondary action → `btn btn-outline`; subtle/icon-text → `btn btn-ghost`. Keep `btn-sm`/`btn-lg` sizing.

### 3. Cards / panels
Ad-hoc white panels (`bg-white rounded-xl|2xl shadow* border*`) → `card` (keep layout classes like flex/gap/spacing).
Pastel feature tiles → `bento bento-violet|blue|peach|mint`. A highlight/gradient stat card → `surface-accent`.

### 4. Page header
Each in-app page opens with a bold title: `text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white`
(or reuse an existing `display-*` / shared header). An optional eyebrow uses `text-eyebrow`. Do not restructure layout.

### 5. Secondary text & borders — light touch, obvious cases only
- muted text `text-gray-400` → `text-ink-4`, `text-gray-500` → `text-ink-3`
- hairline borders `border-gray-100|200` → `border-ink-7`
- light surface fills `bg-gray-50|100` → `bg-ink-8`
Skip anywhere it would change meaning or inside builder canvases.

### 6. Tabs / segmented controls
Active → `bg-gradient-accent text-white shadow-soft`; track → `glass` or `bg-ink-8`; inactive → `text-ink-3 hover:text-ink`.

### 7. Status badges
Inline status pills → `badge badge-success|warning|danger|brand|gray` where it maps cleanly.

## Exceptions
- **Builders** (`BuilderPage`, `EmailBuilderPage`, `ESignBuilderPage`, `components/builder/*`): intentional
  dark editor chrome. Apply ONLY rule 1 (accent sweep) + rule 2 (primary buttons). Do NOT lighten dark panels
  or restyle the GrapesJS canvas / toolbars.
- **Public/auth pages** (`LandingPage`, `LoginPage`, `GetStartedPage`, `AcceptInvitePage`,
  `ForgotPasswordPage`, `ResetPasswordPage`, `ESignSigningPage`, `ESignVerifyPage`): bespoke layouts —
  keep them; apply rules 1–3 (align colors, buttons, cards). Landing is already strong — light touch.

## Report
List each file changed with a one-line note of what you did. Flag anything you skipped or were unsure about.
