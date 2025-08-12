# React + TypeScript + Vite

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

Notes:

- The Save dialog has accessible attributes (`role="dialog"`, `aria-labelledby`) to make testing and a11y better.
- Keep service tests isolated from Supabase by mocking `ClothingService` rather than hitting the network.

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
