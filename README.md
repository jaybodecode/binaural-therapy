# Binaural Therapy

A state-transitioning binaural beat and colored noise PWA, designed iOS-first as a Home Screen installable web app.

## Status

**v1 functional specification complete.** No production code yet.

- [`appspec.md`](./appspec.md) — the authoritative v1 specification. Read this first.

## Planned stack

- Vue 3 SPA + Vite + Tailwind CSS
- Native Web Audio API (no Tone.js)
- vite-plugin-pwa (Workbox) for service worker + install
- localStorage + IndexedDB for persistence
- Freesound (CC0/CC-BY) for ambient loops
- Hosted on GitHub Pages via GitHub Actions

## What this is not (v1)

- Not a native iOS app
- Not a medical device
- Not a cloud-synced account system
- Not a music player

## Roadmap

See `appspec.md` §15. M0 = repo bootstrap.

## Source-of-truth input

The original spec lives at `/mnt/hgfs/OMARCHY_SHARED/binaural_therapy_app_spec.json`. This repo extends it with iOS-first delivery, PWA constraints, and a deep literature digest (§3).

## License

To be decided in M5. Currently: all rights reserved by the repo owner; loop attributions tracked in `attribution.md` (to be created in M4).
