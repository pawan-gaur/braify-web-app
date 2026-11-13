# braify-web-app

The React frontend for Braify. It covers PDF templates, email templates and bulk campaigns, e-signature, file storage and the platform admin. It talks to [`braify-web-services`](../braify-web-services), the Spring Boot backend.

**Stack:** React 18, Vite 5, Tailwind 3, react-router 6, axios, GrapesJS (template builders), pdf.js.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api`, `/v3` and `/swagger-ui` to the backend on `http://localhost:8080`. Start the backend first:
```bash
cd ../braify-web-services && mvn spring-boot:run
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | ESLint. Errors fail CI; warnings are advisory |
| `npm test` | Vitest unit tests (`src/**/*.test.{js,jsx}`, jsdom). They run in CI before every deploy |

## Configuration
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_ORIGIN` | *(empty: same origin)* | Backend origin, only if the API is on another domain, e.g. `https://api.braify.com` (no `/api`). In production, nginx serves the app and proxies `/api` on the same domain. |

## Project layout
- `src/pages/`: one component per route (`App.jsx` holds the routes and role guards).
- `src/components/`: shared UI, grouped by feature.
- `src/services/api.js`: every API call, as named exports returning `r.data`. The axios interceptor turns errors into `Error(message)` with `.status`.
- `src/context/`: auth (user, features, roles), toasts, app layout state.
- `src/hooks/useUrlState.js`: list pages keep page, filters, search and tab in the URL. Use `listUrl('/path')` for Back links.
- `src/styles/global.css`: design-system classes (`.btn-*`, `.card`, `.form-input`, `.badge-*`). Follow `DESIGN_MIGRATION.md` for styling; the Dashboard is the reference page.

More detail is in `../architecture/FRONTEND.md`.

## Deploy
GitHub Actions builds on push: `main` deploys to prod, `develop` deploys to dev. Each build is uploaded to `/var/www/braify-web-app-releases/<sha>/`, and the live symlink `/var/www/braify-web-app` is switched atomically. See `braify-web-services/ops/README.md` for rollback.
