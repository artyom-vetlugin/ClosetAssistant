# Closet Assistant

Smart wardrobe manager with outfit suggestions, Supabase auth/storage, and PWA support.

> Full backend setup and SQL: see `SUPABASE_SETUP.md` and `supabase-setup.sql`. See `VISION.md` for data model and roadmap.

## Quickstart

```bash
npm i
cp .env.example .env.local
# fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local
npm run dev
```

## Environment

Create `.env.local` (copy from `.env.example`):

```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

- Credentials are public anon (not service_role).
- Storage bucket used: `clothing-images`.
- See `SUPABASE_SETUP.md` for DB schema, auth redirects, and storage policies.

## Features

- Supabase auth + RLS-backed wardrobe data
- Image upload with compression + optional background removal
- Outfit suggestion engine with color rules and rotation
- PWA (offline caching for public storage images)
- Tests: color rules, outfit suggestions, core UI flows

## Stack
- React 19
- TypeScript 5
- Vite 7 (+ `@vitejs/plugin-react`)
- React Router 7
- Tailwind CSS 3 (PostCSS + Autoprefixer)
- Supabase JS v2
- Imaging: `browser-image-compression`, `@imgly/background-removal`
- Tooling: ESLint 9, `typescript-eslint`
- Testing: Vitest + React Testing Library + jsdom

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Testing

This project uses Vitest with React Testing Library (jsdom) for fast unit/component tests.

Scripts:

```bash
npm run test       # run once (CI-friendly)
npm run test:watch # watch mode
```

Config lives in `vite.config.ts` under the `test` key. Test setup is in `src/test/setup.ts`.

What’s currently covered:

- Color rules engine: `src/lib/colorRules.test.ts`
  - Neutral/bold classification, pairing, scoring, reasoning
- Outfit suggestions service: `src/lib/outfitService.test.ts`
  - Uses a mocked `ClothingService` to isolate Supabase; checks scoring threshold and insufficient items
- UI interaction: `src/components/OutfitCard.test.tsx`
  - Modal open/save flow using `@testing-library/user-event`

## Recent Enhancements

- Variation rule in outfit suggestions: avoids items used in the last 3 wear logs to increase rotation and novelty
- Storage cleanup: deleting a clothing item now best-effort removes its image from Supabase Storage to prevent orphans
- PWA runtime caching: Supabase public storage images are cached via Workbox for faster loads and basic offline grids

## PWA Notes

`vite-plugin-pwa` is configured with:

- `registerType: 'autoUpdate'`
- Precache common assets via `globPatterns`
- Runtime caching rule for Supabase public storage images (`clothing-images` bucket) using CacheFirst with 30-day expiration

To update the service worker after changes:

```bash
npm run build && npm run preview
```

Visit the app, then check the Application tab in DevTools → Service Workers to confirm the new SW is active.

Notes:

- The Save dialog has accessible attributes (`role="dialog"`, `aria-labelledby`) to make testing and a11y better.
- Keep service tests isolated from Supabase by mocking `ClothingService` rather than hitting the network.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck + production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint
- `npm run test` — run Vitest (jsdom)
- `npm run test:watch` — watch mode
- `npm run test:coverage` — coverage

## Requirements

- Node >= 18.18

## Deployment

- Build: `npm run build` → output in `dist/`
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Configure SPA fallback (serve `index.html` for unknown routes)
- PWA: service worker only activates on HTTPS and production builds

## License

MIT

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
