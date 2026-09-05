# Changelog

All notable changes to Binaural Therapy are recorded here. Dates are UTC.

## [Unreleased] — M0 scaffold

### Added

- Vue 3 + Vite + TypeScript strict + Tailwind CSS v4 + Pinia scaffold
- vite-plugin-pwa with Workbox (`registerType: 'prompt'`, runtime caches for `/loops/*` and `/attribution/*`)
- Apple HIG-shaped design tokens (44pt tap targets, safe-area insets, system font)
- iOS Web Audio placeholder StartGate in `HomeView.vue` (M0 only — real engine in M1)
- `UpdateToast.vue` component wired to `vite-plugin-pwa` update lifecycle per `appspec.md §7.5`
- `pwa.ts` module: registers the SW, exposes update-state via `onUpdateState`, `SKIP_WAITING` on demand
- `router` with `/`, `/about`, `/credits` routes (about/credits are M4/M5 placeholders)
- `session` Pinia store placeholder (real store in M1/M3)
- GitHub Actions workflow: lint + format check + type-check + icon generation + build + GH Pages deploy
- `appspec.md` v1 (847 lines, 19 sections) — source-of-truth functional spec
- `.nvmrc`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `eslint.config.js`
- `.gitignore` (Node/Vite/PWA/IDE), `README.md`

### Deferred to later milestones

- M1: Web Audio engine composables (left/right oscillators, ramping, iOS `<audio>` anchor, audioSession unlock)
- M2: full atmosphere catalogue + localStorage presets + theme support
- M3: Sleep Journey stage machine + MediaSession metadata + NowPlayingCard
- M4: Freesound loop integration + IndexedDB cache + `/credits` copy from appspec §6.5
- M5: iPad layout + accessibility audit + Lighthouse perf + reduced-motion variant
