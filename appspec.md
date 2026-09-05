# appspec.md — Binaural Therapy & Auditory Entrainment iOS PWA

> **Status:** v1.0 functional specification. No production code committed yet.
> **Source of truth:** `/mnt/hgfs/OMARCHY_SHARED/binaural_therapy_app_spec.json` (referenced, not copied). This document extends the spec with iOS-first delivery, PWA constraints, and a deep literature digest.
> **Companion docs (to be created in later milestones):** `architecture.md`, `research-questions.md`, `attribution.md`.

---

## 0. Preface — Development Tooling Decisions

These decisions are recorded up-front so future contributors (including future-us) don't relitigate them.

| Decision                  | Choice                                                                                                                                     | Why                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**             | Vue 3 SPA + Vite + Tailwind                                                                                                                | Native Web Audio APIs are 100% client-side; SPA avoids SSR/SSG hydration mismatches and `<ClientOnly>` plumbing. Leaner bundle than Nuxt.              |
| **Audio engine**          | Native `OscillatorNode` / `AudioBufferSourceNode` composables                                                                              | Cleanest signal path for iOS `<audio>` anchor (Section 8.3). Pure sine waves without framework jitter. No Tone.js dependency.                          |
| **iOS audio workaround**  | `<audio>` MediaStream anchor + `navigator.audioSession.type = "playback"` + MediaSession API                                               | iOS WebKit suspends `AudioContext` on background/lock; the `<audio>` element is the only carve-out that keeps the web process alive with audio output. |
| **PWA / hosting**         | `vite-plugin-pwa` (Workbox), GitHub Pages static deploy, GitHub Actions CI/CD                                                              | $0 hosting, instant updates, no Node server.                                                                                                           |
| **Ambient loops**         | Synth (pink/brown filtered white) + Freesound CC0/CC-BY for natural loops                                                                  | Section 6.                                                                                                                                             |
| **Persistence**           | `localStorage` for presets/settings (typed JSON, Zod-validated); IndexedDB via `idb-keyval` for loop blob cache                            | Loops survive quota; presets stay typed.                                                                                                               |
| **Linting / typing**      | TypeScript strict, ESLint + `eslint-plugin-vue`, Prettier, `vue-tsc` typecheck                                                             | Standard Vue 3 baseline.                                                                                                                               |
| **Component library**     | Hand-rolled Tailwind components shaped to Apple HIG (44pt tap targets, safe-area insets, system font, frosted materials)                   | Bespoke audio-first aesthetic; no off-the-shelf UI lib for the unique state-machine visuals.                                                           |
| **Primary coding model**  | **GLM 5.2** (independently-verified SWE-Bench Pro 62.1%, Terminal-Bench 81.0%)                                                             | Best third-party-verified coding scores for iOS audio debugging work.                                                                                  |
| **Fallback coding model** | **MiniMax M3** (80.5% SWE-Bench Verified, 1M context, $0.30/$1.20 per M tokens)                                                            | Cost-effective for long sessions where context window matters.                                                                                         |
| **Avoid**                 | Kimi K2.7 (256K context limit; vendor-only benchmarks); Tone.js (unnecessary abstraction); Nuxt SSR (hydration + no benefit for audio app) | —                                                                                                                                                      |

---

## 1. Product Brief & Goals

### 1.1 What it is

A single-page Vue 3 PWA installed to the iOS/iPadOS Home Screen that generates **state-transitioning binaural beats** layered with **colored noise masking** and optional **natural ambient loops**, to support sleep onset, deep relaxation, calm focus, and active concentration.

### 1.2 Primary goal

Provide a reliable, **lock-screen-survivable** audio engine for a 45-minute Sleep Journey ramp (Beta → Alpha → Theta → Delta → indefinite maintenance brown noise) on an iPhone or iPad left on a nightstand, with no native iOS app required.

### 1.3 Secondary goals

- Two interaction modes: **State Lock** (pick a band, stay there) and **Sleep Journey** (multi-stage ramp).
- Honest, non-medical positioning: auditory _support_, not therapy.
- Modern, accessibility-first PWA that installs cleanly, runs offline, and degrades gracefully.

### 1.4 Non-goals (v1)

- No Apple Watch companion. No HealthKit integration. No Apple CarPlay support.
- No native iOS App Store build (PWA-first; Capacitor wrapper deferred to a later milestone if needed).
- No social / sharing / leaderboard features. No user accounts.
- No cloud sync. All state is local.

---

## 2. Target Devices

### 2.1 Primary: iPhone + iPad (Safari 16.4+ → iOS 16.4+)

- Must work as a **Home Screen Web App** (`display: standalone` manifest).
- Must work in **pure Safari tab** mode (some users in the EU get this regardless of manifest, due to DMA).
- Must survive **screen lock**, **app switch**, and **backgrounding for ≥8 hours** without audio dropouts.
- Must respect the **hardware Ring/Silent switch** (bypass via `navigator.audioSession.type = "playback"`).
- Must not require Wake Lock — users _want_ the screen off during sleep.

### 2.2 Secondary: Android (Chrome 90+)

- Background audio works natively; the `<audio>` anchor pattern (8.3) is less critical but harmless.
- Wake Lock API works since Chrome 84; we will not request it (see 14).
- Installation prompt via `beforeinstallprompt`; same Workbox SW.

### 2.3 Tertiary: Desktop (Chrome, Safari, Firefox, Edge)

- Full layout, keyboard shortcuts, larger visualization.
- Desktop Safari is WebKit-based: still subject to audioSession quirks but less aggressive than iOS.

### 2.4 Form-factor breakpoints

| Breakpoint                     | Width        | Layout                                                 |
| ------------------------------ | ------------ | ------------------------------------------------------ |
| Phone portrait                 | < 640 px     | Single column, sticky CTA at bottom, dimmed by default |
| Phone landscape / small tablet | 640–1024 px  | Two-column: controls + timeline                        |
| Tablet / desktop               | 1024–1440 px | Three-column: controls · visualization · presets       |
| Large desktop                  | > 1440 px    | Three-column with expanded visualization panel         |

---

## 3. Neuroscience Foundations

This digest grounds the design defaults. Every clinical-style claim in the app copy must trace back to one of these references with the caveats preserved.

### 3.1 Garcia-Argibay, Santed & Reales (2019) — meta-analysis of binaural-beat efficacy

- **Citation:** Garcia-Argibay, M., Santed, M. A., & Reales, J. M. (2019). _Psychological Research_, 83(2), 357–372. DOI: 10.1007/s00426-018-1066-8. PMID: 30073406.
- **Summary:** 22 studies met inclusion; pooled effects significant for **anxiety reduction, pain attenuation, and modest gains in attention / working memory / long-term memory**. Effects are frequency-specific, not a single "relaxation" outcome.
- **Quote:** "The direction and the magnitude of the effect depends upon the frequency used, time under exposure, and the moment in which the exposure takes place."
- **Caveats:** Small-study pool (often n < 30); within-subject sham designs with limited blinding; publication-bias flags for some outcomes. Predates Ingendoh (2023) and the EEG-entrainment null findings.
- **Design implication:** → Justifies offering **frequency-specific presets** (delta for sleep, alpha/theta for relaxation, beta/gamma for focus) rather than a single "binaural" track, and supports per-band default exposure durations of **≥10 min** where data are strongest.

### 3.2 Ingendoh, Posny & Heine (2023) — systematic review of EEG entrainment

- **Citation:** Ingendoh, R. M., Posny, E. S., & Heine, A. (2023). _PLoS ONE_, 18(5), e0286023. DOI: 10.1371/journal.pone.0286023. PMCID: PMC10198548. PMID: 37205669.
- **Summary:** Of 14 EEG studies, **5 supported scalp-level entrainment to the binaural beat, 8 contradicted it, 1 mixed**. Robust support for **subcortical FFR/ASSR**; **global scalp EEG entrainment is inconsistent**. Many behavioral effects likely operate via autonomic modulation, HRV, interoception, and masking rather than cortical entrainment.
- **Quote:** "Five studies reporting results in line with the brainwave entrainment hypothesis, eight studies reporting contradictory results, and one mixed results."
- **Caveats:** Authors note that many psychological-outcome studies _assumed_ entrainment without measuring EEG, which challenges their own conclusions. Carrier, intensity, montage, and "entrainment" definition vary wildly.
- **Design implication:** → **Do not market Binaural Therapy as a proven EEG-entrainment product.** Frame it as an auditory stimulus whose effects may act via subcortical FFR, autonomic modulation, masking, and expectancy. Keep default carrier in 200–500 Hz (Oster's sweet spot, §3.6) and tone gain low enough not to mask the beat percept.

### 3.3 Papalambros et al. (2017) — pink-noise slow-wave enhancement in older adults

- **Citation:** Papalambros, N. A., et al. (2017). _Frontiers in Human Neuroscience_, 11, 109. DOI: 10.3389/fnhum.2017.00109.
- **Summary:** 13 older adults (60–84 y) received one night of **closed-loop pink-noise pulses phase-locked to the upstate of endogenous slow waves** (via real-time PLL on frontopolar EEG) and one sham night. During ON intervals, slow-wave activity (SWA, 0.5–4 Hz) and spindle activity rose significantly; **overnight word-pair memory improvement was ~3× larger after pink-noise stimulation**.
- **Quote:** "The average improvement was three times larger after pink-noise stimulation."
- **Caveats:** n = 13, single-night, within-subject. The closed-loop PLL **requires EEG**, which a consumer app cannot deliver. Several co-authors have a pending patent / founded DeepWave Technologies. Replicated in young adults (Ngo 2013, Ong 2016); direct replication in independent older-adult cohorts still limited.
- **Design implication:** → Justifies including **pink-noise masking** as a sleep-track option _in addition to_ pure-tone binaural beats (independent mechanism). Use **pink noise (1/f, ≈ −3 dB/octave)** rather than white noise as the sleep-mask carrier. **Do not promise equivalent gains** — we cannot replicate the closed-loop PLL.

### 3.4 Adaikkan et al. (2019) — 40 Hz sensory stimulation and neuroprotection

- **Citation:** Adaikkan, C., et al. (2019). _Neuron_, 102(5), 929–943.e8. DOI: 10.1016/j.neuron.2019.04.011. Foundational precursor: Iaccarino et al. 2016, _Nature_ 540:230–235.
- **Summary:** In Tau P301S and CK-p25 mouse models, 1 h/day of 40 Hz visual flicker (GENUS) entrained 40 Hz oscillations across V1, CA1, hippocampus, and prefrontal cortex; reduced neuronal/synaptic loss; upregulated cytoprotective proteins; improved spatial learning. Microglial transcription shifted away from a neurodegenerative profile toward phagocytic/lysosomal — supporting the **microglial-clearance hypothesis**.
- **Quote:** "GENUS reduces neuronal and synaptic loss in mouse models of neurodegeneration… improves spatial learning and memory."
- **Caveats:** **Preclinical mouse data**, not human clinical evidence. 2025 _Communications Biology_ intracranial-EEG study shows 40 Hz visual entrains the human hippocampus, but **human amyloid/tau trials have been null** (Ismail; He). 2023 _Nature Neuroscience_ (Soleimani) reported 40 Hz light flicker did _not_ entrain native gamma in AD-model mice. **GENUS is not FDA-cleared therapy.**
- **Design implication:** → Can justify an exploratory **"Focus+"** track with an auditory 40 Hz component, with copy explicitly stating "based on preclinical neuroscience research; clinical benefit unproven." **Do not claim AD or cognitive-decline prevention.** Flag in app-store copy.

### 3.5 Linkenkaer-Hansen et al. (2001) — 1/f scaling of resting human EEG

- **Citation:** Linkenkaer-Hansen, K., Nikulin, V. V., Palva, J. M., & Ilmoniemi, R. J. (2001). _Journal of Neuroscience_, 21(4), 1370–1377. DOI: 10.1523/JNEUROSCI.21-04-01370.2001.
- **Summary:** MEG/EEG recordings from healthy adults at rest show the _amplitude envelope_ of ongoing oscillations in alpha (~10 Hz) and beta (~20 Hz) bands follows a power-law P(f) ∝ 1/f^β with β typically **0.5–1.0** — close to pink noise (β = 1), not white (β = 0) or Brownian (β = 2). Heritable (twin study, 2007). **Canonical citation for "resting human EEG has a 1/f signature."**
- **Quote:** "Here we demonstrate the presence of long-range temporal correlations and power-law scaling behavior of oscillations at ~10 and 20 Hz."
- **Caveats:** Power-law fits in finite biological data are sensitive to fitting range (Stumpf & Porter 2012). DFA exponents cluster ~0.65–0.75 — **between pink and white, not exactly 1/f**. β estimates vary across subjects (0.07–1.06).
- **Design implication:** → Use **pink noise** as the default sleep masking spectrum on the grounds that it spectrally matches resting EEG amplitude modulation and is therefore acoustically "neutral" / minimally arousing. Drives the **noise-color picker** (white / pink / brown).

### 3.6 Oster (1973) — the original binaural-beat paper

- **Citation:** Oster, G. (1973). Auditory beats in the brain. _Scientific American_, 229(4), 94–102. (Archive: https://archive.org/details/magazine-article-1973-scientific-american-auditory-beats-in-the-brain-gerald-oster.)
- **Summary:** Synthesized Heinrich Dove's 1839 discovery with modern psychophysics. Key empirical claims still cited: (a) binaural beats require both ears, are **neurally generated in the brainstem (superior olivary complex)**, not acoustically summed; (b) best perceived with **carrier tones near 200–500 Hz**; above ~1000 Hz they vanish; (c) beat frequencies up to ~30 Hz are perceptible; (d) some neurological patients cannot perceive them, suggesting a diagnostic use. Oster framed beats primarily as a **research and diagnostic tool, not a therapy**.
- **Quote:** "Binaural beats are best perceived when the carrier frequency is about 440 hertz; above that frequency they become less distinct and above about 1,000 hertz they vanish altogether."
- **Caveats:** _Scientific American_ essay, single author; not peer-reviewed empirical paper; speculative in places. The "healing" framing postdates Oster.
- **Design implication:** → Justifies default **carrier 200–500 Hz** in the binaural generator, the upper bound ~1000 Hz, and the lower beat-frequency limit ~1 Hz delta up to ~30 Hz beta. Justifies the **stereo headphones requirement** (single-speaker playback collapses to monaural beats, a different phenomenon).

### 3.7 Synthesis — what we may and may not claim

| Claim in app copy                               | Strongest source            | Honest qualifier                                          |
| ----------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| Binaural beats reduce anxiety & aid analgesia   | Garcia-Argibay 2019         | Meta-analytic, small-study pool, frequency-specific       |
| Scalp-EEG entrainment to binaural beats is real | Ingendoh 2023               | **Inconsistent**; subcortical FFR yes, global cortical no |
| Pink noise boosts slow-wave sleep & memory      | Papalambros 2017            | Requires EEG + PLL; consumer app cannot replicate         |
| 40 Hz stimulation may be neuroprotective        | Adaikkan 2019 (preclinical) | Mouse data; human amyloid trials null so far              |
| Resting EEG is "pink" (1/f)                     | Linkenkaer-Hansen 2001      | β ≈ 0.7–1.0, not strictly 1.0                             |
| Binaural beats are real, brainstem-generated    | Oster 1973                  | Historical / foundational, not a therapy paper            |

**Bottom line.** The neuroscience supports Binaural Therapy as a _plausibly-acting_ auditory aid whose strongest, best-replicated effects are on **anxiety/relaxation** (Garcia-Argibay 2019) and on providing a **benign spectral mask for sleep** (Papalambros 2017; Linkenkaer-Hansen 2001). Claims about cortical entrainment (Ingendoh 2023) and 40 Hz neuroprotection (Adaikkan 2019) must be cited with their caveats or they will not survive a clinician's review. See §14 for the full ethical-positioning framework.

---

## 4. Brainwave Band Catalogue

The five canonical bands from the source spec, kept as design tokens. All carrier frequencies stay in Oster's optimal 200–500 Hz window.

| Band  | Beat range (Hz) | Default beat (Hz) | Carrier (Hz) | Target state                            | Preferred noise                 | Notes                                                                                             |
| ----- | --------------- | ----------------- | ------------ | --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Delta | 0.5 – 4.0       | 2.0               | 160          | Deep slow-wave sleep, restoration       | Brown / heavy surf              | Acutely drives SWS amplitude; matches Papalambros 2017 mechanism (closed-loop PLL not replicated) |
| Theta | 4.0 – 8.0       | 6.0               | 210          | Hypnagogia, deep relaxation, meditation | Brown/pink blend, rolling waves | Hypnagogic state; lowest carrier for theta to keep carrier audible                                |
| Alpha | 8.0 – 13.0      | 10.0              | 240          | Calm focus, wakeful relaxation          | Pink / steady rain              | Bridges alertness and calm; most-studied in pre-operative anxiety                                 |
| Beta  | 14.0 – 30.0     | 18.0              | 300          | Active concentration, working memory    | Pink / flowing stream           | Use sparingly; sustained beta can be arousing                                                     |
| Gamma | 30.0 – 50.0     | 40.0              | 320          | Information synthesis, exploratory      | Minimal pink / ambient drone    | 40 Hz is the Adaikkan GENUS frequency; **preclinical only**                                       |

Band cards are rendered in the UI with: icon, name, beat-frequency range slider, carrier fixed, default atmosphere, and a one-sentence evidence note (pulled from §3).

---

## 5. Audio Engine Architecture

### 5.1 Why native Web Audio, not Tone.js

Tone.js is built for music production (BPM grids, MIDI synths, polyphony, step sequencers). For Binaural Therapy the audio graph is small and precise — and the iOS-specific `<audio>` MediaStream anchor (8.3) is easier to reason about when there is no framework abstraction between us and the nodes.

**Benefits of native:**

- Mathematically pure sines from `OscillatorNode` with no scheduling jitter.
- ~200 lines of clean TypeScript vs. ~150 KB minified Tone.js bundle.
- Direct, predictable control over `MediaStreamAudioDestinationNode → <audio>` routing.

### 5.2 Node graph

```
Left ear:  OscillatorNode(sine, f_carrier) -> StereoPannerNode(pan: -1) -> ToneGainNode
Right ear: OscillatorNode(sine, f_carrier + Δf) -> StereoPannerNode(pan: +1) -> ToneGainNode
Atmosphere: AudioBufferSourceNode (loop) -> BiquadFilterNode -> AtmosphereGainNode
                                                   \-> AnalyserNode -> UI visualization
Master:    [LeftGain, RightGain, AtmosphereGain] -> MasterGain
                                                -> AudioContext.createMediaStreamDestination()
                                                -> <audio srcObject={dest.stream}>   <- iOS anchor
                                                -> AudioContext.destination          <- direct path
```

**Dual output** (both MediaStream destination _and_ `audioContext.destination`) lets desktop / Android / older iOS use the direct path, while iOS gets the `<audio>` anchor without losing the desktop path.

### 5.3 Ramping protocol

Frequency and gain changes never jump; they always ramp to prevent clicks and the worst listener fatigue.

- `audioParam.cancelScheduledValues(currentTime)`
- `audioParam.setValueAtTime(currentValue, currentTime)`
- `audioParam.linearRampToValueAtTime(targetValue, currentTime + rampSeconds)`

**Ramp duration by parameter:**

| Parameter           | Ramp (s) | Rationale                                     |
| ------------------- | -------- | --------------------------------------------- |
| Beat frequency (Δf) | 60       | Subtle, sleep-safe; matches a stage boundary  |
| Carrier frequency   | 5        | Inaudible at this rate; matches a band switch |
| Tone gain           | 1.5      | Smooth fade-in / fade-out                     |
| Atmosphere gain     | 2.5      | Crossfade between atmospheres                 |
| Master gain         | 0.05     | Anti-pop on Play / Stop                       |

**Sleep Journey stages** ramp beat frequency across their full duration using a single long `linearRampToValueAtTime` call. Stage boundaries are explicit `cancelScheduledValues` + `setValueAtTime` checkpoints.

### 5.4 Performance considerations

- One `OscillatorNode` per ear, started once and left running; only frequency is ramped. Oscillators are CPU-cheap.
- `AnalyserNode` runs only when the UI visualization is visible (suspend when offscreen via `audibility` heuristic on `IntersectionObserver`).
- Filter coefficients are computed once and reused.
- AudioWorklet is **not** required; the graph fits comfortably on the default ScriptProcessorNode-equivalent audio thread.

---

## 6. Sourced Ambient Loops

### 6.1 Loop candidates (verified Freesound listings)

All entries below were verified by loading the Freesound page and reading the license tag, duration, and sample format. **Re-verify the license on the Freesound download page before bundling** (license tags can change).

**Steady Rain (pink-profile):**

| Title                                    | URL                                                  | License   | Duration                | Format                           |
| ---------------------------------------- | ---------------------------------------------------- | --------- | ----------------------- | -------------------------------- |
| Soft rain in the city at night ambience  | https://freesound.org/people/mihnelis/sounds/802219/ | CC-BY 4.0 | 11:00 (trim to 60–90 s) | 48 kHz / 24-bit / stereo         |
| Rain Loop                                | https://freesound.org/people/qubodup/sounds/212580/  | CC-BY 3.0 | ~30 s seamless          | 44.1 kHz / MP3 128 kbps / stereo |
| AMBIENT – Rain – Soft Thunder (LOOP).mp3 | https://freesound.org/people/Arctura/sounds/34070/   | CC-BY 3.0 | 0:30                    | 44.1 kHz / MP3 128 kbps / stereo |

**Ocean Waves (brown-profile, 0.1 Hz surge preferred):**

| Title                          | URL                                                   | License   | Duration          | Format                           |
| ------------------------------ | ----------------------------------------------------- | --------- | ----------------- | -------------------------------- |
| Ocean Waves.wav                | https://freesound.org/people/Noted451/sounds/531015/  | CC0       | ~2:00 (trim)      | 44.1 kHz / WAV / stereo          |
| Gentle Ocean Waves Loop        | https://freesound.org/people/kkenny101/sounds/852826/ | CC0       | 0:22 (loop twice) | 48 kHz / 24-bit / mono           |
| Ocean Waves Loop – Night       | https://freesound.org/people/Koops/sounds/586116/     | CC-BY 4.0 | ~1:01             | 44.1 kHz / 32-bit / stereo       |
| Crashing Ocean Waves (3 hours) | https://freesound.org/people/hansendex/sounds/263995/ | CC0       | 179:14 (trim)     | 44.1 kHz / MP3 256 kbps / stereo |

**Gentle Wind (pink-profile):**

| Title                                                | URL                                                       | License   | Duration | Format                     |
| ---------------------------------------------------- | --------------------------------------------------------- | --------- | -------- | -------------------------- |
| Looping Gentle Wind Ambience on an Open Desert Plain | https://freesound.org/people/dhallcomposer/sounds/697217/ | CC-BY 4.0 | 0:41     | 48 kHz / 24-bit / stereo   |
| Wind, Synthesized, A.wav                             | https://freesound.org/people/InspectorJ/sounds/376415/    | CC-BY 4.0 | 1:11     | 44.1 kHz / 16-bit / stereo |

**Forest Birds (optional):**

| Title                                | URL                                                    | License   | Duration          | Format                   |
| ------------------------------------ | ------------------------------------------------------ | --------- | ----------------- | ------------------------ |
| Forest birds – ambient seamless loop | https://freesound.org/people/Magnesus/sounds/723913/   | CC0       | 0:27 (loop twice) | 48 kHz / 16-bit / stereo |
| ambient-forest-loop.wav              | https://freesound.org/people/TobyNT-SFX/sounds/613262/ | CC-BY 4.0 | 1:08              | 48 kHz / 32-bit / stereo |

**Distant Thunder (optional):**

| Title                           | URL                                                        | License   | Duration    | Format                           |
| ------------------------------- | ---------------------------------------------------------- | --------- | ----------- | -------------------------------- |
| Distant Thunder Rumble Ambience | https://freesound.org/people/DBlover/sounds/478666/        | CC-BY 4.0 | 2:06 (trim) | 44.1 kHz / MP3 320 kbps / stereo |
| distant rumble of thunder.wav   | https://freesound.org/people/freemanwalking/sounds/570334/ | CC0       | 0:17        | 44.1 kHz / 16-bit / stereo       |

### 6.2 Format & encoding strategy

- **Preferred encoding:** Opus-in-WebM (~40 kbps, VBR), mono downmixed where loops are mono-native.
- **Fallback encoding:** MP3 ~96 kbps CBR.
- **Loop length:** 30–90 s; crossfade 2 s at boundary.
- **Normalization:** peak-normalized to −3 dBFS; no limiting.

### 6.3 Storage & cache pipeline

1. First play of a loop: fetch from `https://cdn.binauraltherapy.app/loops/<id>.opus`
2. Decode via `OfflineAudioContext` to a single `AudioBuffer` once.
3. Store the encoded blob (not the decoded buffer) in **IndexedDB** via `idb-keyval` so re-download is skipped on relaunch.
4. On second play: hydrate from IndexedDB → decode → play.

Workbox runtime cache (`CacheFirst` strategy) wraps the fetch as a second line of defense.

### 6.4 Crossfade logic

- Switching between atmospheres: 2.5 s equal-power crossfade on `AtmosphereGainNode`.
- Pausing: 1.5 s linear fade to 0; no abrupt cut.
- Stage boundary in Sleep Journey: a 30 s "stage transition" cross-region where the new atmosphere gains over the old.

### 6.5 Attribution page (`/credits` route)

Required by CC-BY 3.0 (must use author's chosen wording verbatim) and courtesy for CC0. Static route, no JS, content shipped in the bundle.

```
Sounds
───────

Steady Rain
  • "Soft rain in the city at night ambience" by mihnelis
    https://freesound.org/people/mihnelis/sounds/802219/
    Licensed under CC BY 4.0

  • "Rain Loop" by Iwan Gabovitch (qubodup)
    https://freesound.org/people/qubodup/sounds/212580/
    Licensed under CC BY 3.0

Ocean Waves
  • "Ocean Waves.wav" by Noted451 — Public domain (CC0)

  • "Ocean Waves Loop - Night" by Koops
    https://freesound.org/people/Koops/sounds/586116/
    Licensed under CC BY 4.0

Gentle Wind
  • "Wind, Synthesized, A.wav" by InspectorJ (Jonathan Shaw)
    https://freesound.org/people/InspectorJ/sounds/376415/
    Licensed under CC BY 4.0

Forest Birds (optional)
  • "Forest birds - ambient seamless loop" by Magnesus — Public domain (CC0)

Distant Thunder (optional)
  • "Distant Thunder Rumble Ambience" by DBlover
    https://freesound.org/people/DBlover/sounds/478666/
    Licensed under CC BY 4.0

All sound files are downloaded once at first launch and
cached in IndexedDB for offline use.
```

---

## 7. PWA & Hosting

### 7.1 Repo shape — single repo, two branches

- **One GitHub repo:** source code lives on `main`; build output is deployed to the `gh-pages` branch by GitHub Actions.
- Source code on `main` stays **private** if desired; `gh-pages` is a build artifact. Setting a CNAME on `gh-pages` prevents GH from also exposing a public `<user>.github.io/<repo>` URL.
- A `CNAME` file (1 line, e.g. `binauraltherapy.app`) committed to `gh-pages` provisions the custom domain + Let's Encrypt cert via GH Pages UI.
- This shape matches what `vuejs/core`, `vitejs/vite`, and most OSS Vue projects use. Two repos would mean two remotes, two CI configs, and a CNAME living in the wrong place — not worth it.

### 7.2 Build & deploy

- **Build tool:** Vite 5+
- **PWA plugin:** `vite-plugin-pwa` (Workbox under the hood)
- **Routing:** Vue Router 4 (history mode; fallback `200.html` for GH Pages deep links)
- **GitHub Actions workflow** (`.github/workflows/deploy.yml`):
  1. On push to `main`: `pnpm install && pnpm build`
  2. `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` (the official GH Pages deploy path; no third-party `peaceiris/actions-gh-pages` needed)
- **Custom domain** is configured once in repo Settings → Pages; the `CNAME` file is generated/maintained by that flow.
- **Preview deploys:** Cloudflare Pages preview on PRs (optional; speeds up design review).

### 7.3 Manifest

- `name`, `short_name`: "Binaural Therapy"
- `display`: `standalone`
- `start_url`: `/`
- `scope`: `/`
- `orientation`: `any` (landscape supported on iPad)
- `theme_color`, `background_color`: pulled from current Omarchy theme at build time
- `icons`: 192, 512, maskable 512; apple-touch-icon 180
- **Manifest changes do NOT trigger a re-install on iOS.** Changing `start_url`, `display`, theme color, or icons leaves the existing Home Screen icon pinned to the old manifest until the user manually removes and re-adds the app. Plan icon/manifest changes carefully — they are effectively a v2 release.

### 7.4 Service Worker (Workbox)

- **Precache:** app shell, fonts, icons, the static `/credits` route, theme tokens
- **Runtime cache:** `CacheFirst` for `/loops/*.opus` (30 days, 50 entries max)
- **Runtime cache:** `StaleWhileRevalidate` for Freesound attribution metadata
- **Update strategy:** Workbox `registerType: 'prompt'` (not `autoUpdate`). See §7.5.

### 7.5 PWA update flow — explicit, not silent

iOS Home Screen PWAs have a sticky web-app process that does **not** auto-refresh code the way a browser tab does. We handle this with an explicit update UX.

**Lifecycle:**

1. New code pushed → GitHub Actions deploys new `dist/` to `gh-pages`.
2. User opens the PWA. The current SW detects a new version is available, downloads + installs it in the background, and parks the new SW in `waiting` state.
3. The app shows an **"Update ready" toast** with two actions:
   - **"Apply now"** — if session is paused/stopped: `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` → `location.reload()`. If session is active: dismissed with a tooltip "Will apply when session ends."
   - **"After session"** — registers a one-shot listener on `pause`/`stop` events, then applies.
4. On next load, the new SW activates and serves the new bundle.

**iOS-specific forced refresh path.** If a user reports stale behavior despite the toast flow: tell them to **swipe the PWA away from the app switcher** and re-tap the Home Screen icon. iOS spawns a fresh web-app process that re-checks the SW. Document this in `/about` → Troubleshooting.

**Storage pressure eviction.** If iOS needs storage, it may evict the SW + cache silently. Next launch = download fresh. Updates can land without user action in this case.

**What must never change without a re-install:**

- `start_url`, `scope`, `display`, manifest `name`
- Icon files at the URL baked into the manifest at install time

**What is safe to change freely:**

- All `/loops/*` (re-cached)
- All theme tokens, copy, component code
- Service worker update logic itself

### 7.6 Why no SSR (or SSG)

- The audio engine is 100% client-side.
- `AudioContext`, `navigator.mediaSession`, `navigator.audioSession` are not available server-side; every audio component must be guarded against SSR.
- SSR adds a Node host (and $$ or free-tier-with-cold-start) for zero benefit.
- Vue 3 SPA + Vite is the leanest, fastest path to GH Pages.

### 7.7 GH Pages subpath gotcha — DO NOT FORGET

When the repo lives under a GH Pages subpath (e.g. `jaybodecode.github.io/binaural-therapy/`), Vite's default `base: '/'` produces an **empty page** that looks black on the iPhone. The browser fetches `/manifest.webmanifest` (404 against apex), `/assets/*.js` (404), and Vue Router fails to resolve any route. Symptoms:

- HTTP 200 on the HTML, but `<div id="app">` stays empty after JS runs
- No console errors (silent failure)
- Browser DevTools → Network shows 404s for all `/assets/*` and `/manifest.webmanifest`

**Fix**: in `vite.config.ts`, set `base: '/binaural-therapy/'` (or whatever the repo subpath is). Vite then rewrites every emitted URL. When a custom CNAME is added later, set `base: '/'` again — also need to drop the subpath from `manifest.start_url`, `manifest.scope`, and the runtime cache patterns.

Also: **GH Pages must be in `build_type: "workflow"` mode**, not `legacy`. Legacy mode serves the `main` branch root, ignoring the artifact uploaded by `actions/deploy-pages@v4`. Create the Pages site via `gh api POST /repos/{owner}/{repo}/pages -f build_type=workflow` to get this right from the start.

---

## 8. iOS-First Interaction Model

This is the make-or-break section. Every choice here is dictated by iOS WebKit quirks documented in real WebKit bug reports.

### 8.1 AudioContext suspension on background / lock

On iOS Safari, when the page loses foreground (tab switch, app switch, screen lock, PWA backgrounding), `AudioContext` is moved out of `running`. Since the `"interrupted"` state was added (WebKit; standardized ~2024/25), iOS uses `interrupted` for OS-initiated pauses and `suspended` for user/app-initiated ones.

**Per-version status (verified):**

- **iOS 17.0–17.1:** Regression — background audio via `<audio>` broke; fixed in 17.1.
- **iOS 17.2.1:** New regression — `<audio>` fails to resume after backgrounding when track ends; Bug **261554** fixed in 17.5.
- **iOS 17.4.1–17.5.1:** Bug **276016** — Web Audio stops after focus loss/gain even when context reports `running`. Fixed in 17.5.1.
- **iOS 26 (Sept 2025+):** Active regression — WebKit Bugs **291892** (Apr 2025) and **295518** (Jul 2025) both open as of Sept 2026. PWAs added to Home Screen can have audio silently break on second foreground.

**Resume strategy:**

```ts
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && audioCtx.state !== 'running') {
    await audioCtx.resume()
    recreateBufferSourcesIfNeeded()
  }
})
```

**Sources:**

- https://bugs.webkit.org/show_bug.cgi?id=261554
- https://bugs.webkit.org/show_bug.cgi?id=276016
- https://bugs.webkit.org/show_bug.cgi?id=291892
- https://bugs.webkit.org/show_bug.cgi?id=295518

### 8.2 `navigator.audioSession.type = "playback"`

WebKit-specific API. Default `type` is `"ambient"` — silent switch mutes the page, page is treated like a notification not media. Setting `type = "playback"` declares intentional media output: silent switch bypassed, audio continues alongside other apps, OS Now Playing surfaces the title.

- **Support:** Safari 16.4+ on iOS 16.4+ and macOS Ventura+. WebKit only; not Baseline.
- **Does it bypass silent switch?** Yes (verified on iOS 18.1, 17.6.1, 16.x). Does **not** bypass on iOS 15.
- **Caveat:** Necessary but not sufficient for background playback (Bug 261554 in 17.2.1 shows `<audio>` can still fail in background even with `type = "playback"`).

```ts
if ('audioSession' in navigator) {
  ;(navigator as any).audioSession.type = 'playback'
}
```

**Sources:** https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession · https://webkit.org/blog/13966/webkit-features-in-safari-16-4/ · https://joellof.com/ios-background-audio · W3C spec: https://w3c.github.io/audio-session/

### 8.3 Audio element as media anchor (the canonical iOS workaround)

Apple's documented background-audio carve-out is `<audio>` / `<video>` playback. The trick: route `AudioContext.createMediaStreamDestination()` into a hidden `<audio>` element's `srcObject`, then call `audio.play()`. iOS treats the page as if it's playing a live stream and keeps WebAudio alive in the background. On lock screen / Now Playing, iOS labels it "Live broadcast".

**Confirmed best practice as of 2026** — this is still the standard workaround for PWA/iOS background audio.

```ts
const ctx = new AudioContext()
const dest = ctx.createMediaStreamDestination()
const anchor = document.createElement('audio')
anchor.srcObject = dest.stream
anchor.setAttribute('playsinline', '')
await anchor.play() // <-- inside user gesture handler

// Wire all audio through `dest` in addition to ctx.destination
masterGain.connect(dest)
masterGain.connect(ctx.destination)
```

**iOS-specific gotchas:**

- `anchor.play()` must be called from a user-gesture handler (8.6).
- Without `audioSession.type = "playback"`, the silent switch still mutes (8.2).
- On Android Chrome this pattern is glitchy — gate it to iOS only.

**Sources:** https://codepen.io/matteason/pen/VYwdzVV (canonical demo) · https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination

### 8.4 MediaSession API

`navigator.mediaSession.metadata` populates the iOS lock-screen Now Playing card and Control Center. Action handlers (`play`, `pause`, `seekbackward`, `seekforward`, `previoustrack`, `nexttrack`, `stop`) are dispatched from lock-screen / AirPods / CarPlay controls.

- **iOS support:** Safari 16.4+ (lock-screen Now Playing artwork broken before then, fixed in 16.4). Works in PWA mode.
- **Critical PWA bug — audio freezes after pause:** Apple Developer Forums thread **762582** documents that in iOS PWAs, if you `pause()` for ~30 seconds, subsequent `play()` from the lock screen fails silently until you foreground the PWA. Status: **not fixed**; still being reported in 2025–26.

```ts
navigator.mediaSession.metadata = new MediaMetadata({
  title: 'Sleep Journey — Stage 2 / 4',
  artist: 'Binaural Therapy',
  album: 'Descending Sleep Ramp',
  artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
})

navigator.mediaSession.setActionHandler('play', startEngine)
navigator.mediaSession.setActionHandler('pause', pauseEngine)
navigator.mediaSession.setActionHandler('stop', stopEngine)
```

**Sources:** https://developer.mozilla.org/en-US/docs/Web/API/MediaSession · https://developer.apple.com/forums/thread/762582

### 8.5 The `"interrupted"` AudioContext state

A 4th value added to `AudioContextState` (`suspended`, `running`, `closed`, `interrupted`). Semantics: the **UA** (not the page) paused playback. Triggers include screen lock when `audioSession.type` is `"auto"`/`"ambient"`, exclusive-access requests (phone call, FaceTime, Siri), Audio Session API interruptions.

**What to do:**

```ts
function play() {
  if (audioCtx.state === 'interrupted') {
    audioCtx.resume().then(play)
    return
  }
  // proceed with normal start
}
```

**Sources:** https://microsoftedge.github.io/MSEdgeExplainers/AudioContextInterruptedState/explainer.html · https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state

### 8.6 User-gesture requirement for `AudioContext.resume()`

iOS Safari strictly requires `AudioContext.resume()` to be called **synchronously inside a user-gesture event handler** (click, touchstart, keydown). React state batching, `setTimeout`, `await`, or `Promise.then` break the gesture chain — the promise resolves but state stays `suspended`.

**Workaround — the "dummy unlock" pattern:**

```ts
// First synchronous line of the click handler:
const unlockCtx = new AudioContext()
await unlockCtx.resume()
// After this once-per-tab unlock, any subsequent context can resume freely
// even from non-gesture code.
```

As of iOS 26 (Bug 291892), there are cases where `resume()` _never resolves_ even from inside the click handler when the page is reopened from the Home Screen. No clean workaround beyond killing Safari's cache.

**Sources:** https://js2devlog.com/en/devlog/ios-safari-audio-unlock · https://stackoverflow.com/questions/57510426/cannot-resume-audiocontext-in-safari · Apple docs: https://developer.apple.com/documentation/webkitjs/audiocontext/1633601-resume

### 8.7 Screen Wake Lock API — **NOT USED**

`navigator.wakeLock.request('screen')` prevents the device from auto-locking the screen. It does **NOT** keep audio playing by itself; for sleep apps it is the wrong tool — users _want_ the screen OFF while audio plays.

**Note for posterity:** Wake Lock is broken for Home Screen PWAs from iOS 16.4 through 18.3.1 (WebKit Bug 254545). Fixed in iOS / iPadOS 18.4 (March 2025). Confirmed working in iOS 26.

### 8.8 Home Screen vs Safari tab

- **Pure Safari tab** (no Add-to-Home-Screen): runs inside Safari; background audio allowed.
- **Home Screen Web App (PWA, `display: standalone`)**: separate web app process. Historically broken for background audio pre-iOS 15.4. iOS 15.4+ supports it; ongoing iOS 26 regressions specifically affect PWAs (Bugs 291892, 295518).
- **EU exception (iOS 17.4+, DMA compliance):** In the EU all PWAs open as Safari tabs regardless of manifest settings. Background-audio behavior is closer to Safari-tab behavior.

**Key insight:** The `<audio>` anchor pattern (8.3) is required for _either_ context to survive backgrounding — the audio hardware is the OS's only way to keep the web process alive. With the anchor pattern, both contexts work.

### 8.9 Implementation cheat sheet

| Symptom                                  | First thing to check                                            |
| ---------------------------------------- | --------------------------------------------------------------- |
| No audio on iPhone at all                | AudioContext not unlocked — apply 8.6 dummy unlock in `onClick` |
| Audio cuts off on screen lock            | Missing anchor pattern — apply 8.3                              |
| Silent switch mutes audio                | `navigator.audioSession.type = "playback"` not set — apply 8.2  |
| Lock screen shows no track info          | `navigator.mediaSession.metadata` not assigned — apply 8.4      |
| Lock-screen play fails after 30s paused  | PWA pause/play freeze — known bug (Apple Forums 762582)         |
| Audio works once then dies on iOS 26 PWA | WebKit Bugs 291892/295518 — only fix is cache wipe / reinstall  |
| `AudioContext.state` is `interrupted`    | Wait for interruption to end, then `resume()` — apply 8.5       |
| Screen dims during long listening        | Use audioSession + anchor, NOT Wake Lock — apply 8.7            |

---

## 9. Persistence

### 9.1 Presets & settings — `localStorage`

- All presets are typed JSON validated with **Zod** schemas on read.
- Keyed by namespace: `bt:presets:v1`, `bt:settings:v1`, `bt:lastSession:v1`.
- Settings include: tone gain, atmosphere gain, last band, last atmosphere, theme.
- Each preset includes a unique ID (UUIDv7), name, and the full mode configuration (band, beat Hz, carrier Hz, atmosphere, durations for Sleep Journey).

### 9.2 Loop blobs — IndexedDB via `idb-keyval`

- Keyed by `loops:v1:<loopId>`.
- Value is the raw encoded blob (Opus-in-WebM or MP3).
- Hydration: on first play, try IndexedDB → fall back to network → cache on success.
- Quota monitoring: on `QuotaExceededError`, fall back to in-memory decode and warn user.

### 9.3 URL hash for shareability

- Last-session state mirrors to `window.location.hash` (e.g. `#band=alpha&atmos=rain&beat=10`).
- App reads hash on load if present.
- Sharing a URL sends someone directly into the same State Lock configuration.

### 9.4 Service Worker as third tier

- Workbox runtime cache (`CacheFirst`, 30 days) for `/loops/*`.
- Provides offline operation and faster repeat load on slow networks.

---

## 10. State-Machine UI

### 10.1 Top-level modes

1. **State Lock** — pick a band, pick an atmosphere, press Play. Stays there until you stop it.
2. **Sleep Journey** — 4-stage descending ramp (Beta → Alpha → Theta → Delta → indefinite maintenance brown noise).

### 10.2 Sleep Journey stage machine

Driven by `Tone.Transport`-style timeline (we'll use `AudioContext.currentTime` + a Pinia store for stage bookkeeping; no Tone.js).

| Stage             | % of session | Start Hz        | End Hz | Band        | Atmosphere                  | Tone gain |
| ----------------- | ------------ | --------------- | ------ | ----------- | --------------------------- | --------- |
| 1 — De-escalation | 22%          | 16.0            | 9.0    | Beta→Alpha  | Pink noise / gentle rain    | 0.15      |
| 2 — Drowsiness    | 33%          | 9.0             | 5.0    | Alpha→Theta | Biquad LPF 8000 → 1200 Hz   | 0.12      |
| 3 — Sleep Onset   | 45%          | 5.0             | 1.5    | Theta→Delta | Deep brown / sub-bass ocean | 0.08      |
| 4 — Maintenance   | indefinite   | 0 (tones faded) | —      | —           | Brown noise, steady low     | 0.00      |

Stage 4 behavior: **fade tones to 0 over 180 s** at stage-3 end to prevent sleep-cycle disruption, then leave brown noise playing to mask bedroom transients.

### 10.3 Component inventory

| Component                | Purpose                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `StartGate`              | Single CTA "Tap to Begin" — invokes the audioSession unlock + audio anchor per 8.6 / 8.3                                             |
| `BandSelector`           | 5 cards (delta, theta, alpha, beta, gamma) with beat-frequency slider and evidence note                                              |
| `AtmospherePicker`       | Cards for: rain, pink-synth, ocean, brown-synth, wind, forest (optional)                                                             |
| `VolumeSlider`           | Tone and atmosphere volume (independent)                                                                                             |
| `StereoCheck`            | "Play Left 440 Hz" / "Play Right 440 Hz" buttons for headphone verification                                                          |
| `JourneyTimeline`        | Visual timeline of the 4 Sleep Journey stages with live progress indicator                                                           |
| `NowPlayingCard`         | Mirrors `navigator.mediaSession.metadata` for visual consistency with lock screen                                                    |
| `StageTransitionOverlay` | 30 s cross-region fade between stages with optional gentle haptic (8.5)                                                              |
| `UpdateToast`            | PWA update prompt (see §7.5). Shown when a new SW is waiting. Two actions: "Apply now" (gated by session state) and "After session". |

### 10.4 State store (Pinia)

```
useSessionStore
  mode: 'state-lock' | 'sleep-journey'
  band: BandId
  atmosphere: AtmosphereId
  beatHz: number       // current, may be ramping
  carrierHz: number
  toneGain: number
  atmosGain: number
  isPlaying: boolean
  journey: {
    currentStage: 1 | 2 | 3 | 4
    stageStartedAt: timestamp
    sessionStartedAt: timestamp
    totalDurationMs: number
  }
```

All store mutations go through a single `audioBridge` module that owns the actual Web Audio nodes, so the store is the source of truth and the engine follows.

---

## 11. Responsive Layout

### 11.1 iPhone portrait (< 640 px)

- Single column.
- Bottom-anchored sticky "Start" CTA (44pt tall).
- Stage timeline hidden behind a "Show timeline" disclosure once playing.
- Default theme: dark, dimmed, **no animation beyond the equalizer pulse**.

### 11.2 iPhone landscape / small tablet (640–1024 px)

- Two columns: controls (40%) + visualization (60%).
- Timeline is visible inline.
- Safe-area insets respected on all edges.

### 11.3 iPad / small desktop (1024–1440 px)

- Three columns: controls · visualization · presets.
- Presets panel lists user presets with edit / delete.
- Keyboard shortcuts: Space = play/pause, `[` `]` = previous/next stage (Sleep Journey).

### 11.4 Large desktop (> 1440 px)

- Same as 11.3 with expanded visualization (full waveform + spectrum).
- Multi-window friendly (each preset opens in its own window).

---

## 12. Accessibility (WCAG 2.2 AA)

- **Contrast:** AA in default theme; AAA in night theme (paper on dark, not pure white).
- **Tap targets:** 44×44 pt minimum (HIG / WCAG 2.5.5).
- **Keyboard:** every control reachable via Tab; sliders operable with arrow keys; visible focus ring.
- **Screen reader:** `aria-valuetext` on beat-frequency slider reports Hz, not %. `aria-live="polite"` announces stage transitions in Sleep Journey.
- **Reduced motion:** when `prefers-reduced-motion: reduce`, replace equalizer pulse with static concentric ring; no fade transitions on stage boundaries.
- **Color independence:** band selection never depends on color alone — each card has a unique icon + label.
- **Captions / transcripts:** not applicable (no speech content).
- **Audio cues:** optional non-essential; never carry information (sleep app must be silent in the default state).

---

## 13. Performance Budget

| Metric                                   | Target   | Notes                                                                  |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------- |
| First-load JS (gzipped)                  | < 200 KB | Vue 3 + Pinia + Web Audio + Workbox SW. Tailwind purges to ~10 KB CSS. |
| LCP on iPhone 12 over 4G                 | < 1.5 s  | Skeleton shown before audio unlocks.                                   |
| Audio thread CPU (sustained, A14 Bionic) | < 5 %    | No oversampling abuse; no AudioWorklet.                                |
| TTI on PWA install                       | < 800 ms | Service worker pre-cached app shell.                                   |
| IndexedDB hit rate (returning sessions)  | > 95 %   | Loops cached after first play.                                         |

**Lighthouse mobile targets:** Performance > 90, Accessibility > 95, Best Practices > 95, PWA > 90, SEO N/A.

---

## 14. Privacy & Ethics

### 14.1 No analytics by default

- No third-party analytics, no fingerprinting, no session recording.
- Optional opt-in to a single privacy-respecting metric (Plausible self-hosted or omitted entirely). **Default: off.**

### 14.2 No health claims in copy

- The app is a **sensory tool**, not a medical device.
- Copy must use language like "supports", "may help", "designed for" — not "treats", "cures", "guaranteed to".
- A disclaimer surfaces on first launch and lives in Settings → About.

### 14.3 Loudness cap

- Hard cap at **75 dB equivalent** (A-weighted) at the headphone output to protect hearing during sleep.
- Master gain cannot be raised past this ceiling; UI slider clamps and shows a tooltip.

### 14.4 No data leaves the device

- No telemetry, no remote logging, no error reporting service.
- All presets, settings, and cached loops are local.
- A "Wipe local data" button in Settings clears localStorage + IndexedDB + Workbox cache.

### 14.5 Clinical disclaimer text (final copy TBD)

> Binaural Therapy is an auditory tool designed to support relaxation, focus, and sleep hygiene. It is **not** a medical device and is not intended to diagnose, treat, cure, or prevent any condition. If you experience persistent sleep, anxiety, or cognitive issues, please consult a qualified clinician.

---

## 15. Milestone Roadmap

### M0 — Repo bootstrap ✅ DONE (2026-09-05)

**Delivered (see `CHANGELOG.md` for the full file list):**

- [x] Vue 3 + Vite + TypeScript strict + ESLint + Prettier scaffold.
- [x] Tailwind CSS v4 wired via `@tailwindcss/vite` with HIG-shaped theme tokens.
- [x] `vite-plugin-pwa` wired with `registerType: 'prompt'`, manifest, icons, runtime caches for `/loops/*` and `/attribution/*`.
- [x] `vue-router` with history mode, `/`, `/about`, `/credits` routes.
- [x] GitHub Actions: lint + format-check + typecheck + icon-generation + build + GH Pages deploy on push to `main`.
- [x] `HomeView.vue` placeholder StartGate that proves the audioSession unlock pattern (§8.6) on the first click.
- [x] `UpdateToast.vue` wired to the SW update lifecycle per §7.5 — gates "Apply now" behind session state.
- [x] `pwa.ts` module: registers the SW, exposes `onUpdateState`, dispatches `SKIP_WAITING` on demand.
- [x] `session` Pinia store placeholder (real store ships in M1/M3).
- [x] `.nvmrc` (Node 20.11.0), `.editorconfig`, `.prettierrc.json`, `eslint.config.js`, `CHANGELOG.md`.
- [x] Source spec at `appspec.md` (847 lines, 19 sections).
- [x] Decision log + open questions appended (§0, §16, Appendix B).

**Tooling note.** This Omarchy 4.0.2 host does not have `pnpm` or `corepack` installed. `package.json` documents npm scripts as the primary entry point; switching to `pnpm` once those tools land is a one-line change.

### M1 — State Lock end-to-end

- Web Audio engine composable: left/right oscillators, frequency ramping.
- iOS audio unlock (8.6) wired into `StartGate` click handler.
- `<audio>` anchor pattern (8.3) gated to iOS only.
- Band selector with all 5 bands.
- Atmosphere picker with the 2 synth atmospheres (pink, brown).
- Volume sliders (tone + atmosphere).
- `localStorage` settings persistence.
- **Done when:** State Lock works on an iPhone 12 over Safari and survives screen lock for 30 min.

### M2 — Full catalogue + presets

- All 4 atmospheres (rain, pink-synth, ocean, brown-synth) with source loops cached in IndexedDB.
- Stereo check utility.
- Preset save / load / share (URL hash).
- Theme support (auto, dark, sepia-night).
- **Done when:** all atmospheres play offline after first visit.

### M3 — Sleep Journey

- 4-stage state machine driven by stage-store + AudioContext timeline.
- `JourneyTimeline` component with live progress.
- `MediaSession` metadata updated per stage (8.4).
- `NowPlayingCard` component.
- Hard 180 s fade at stage-3 → stage-4 boundary.
- **Done when:** full 45-min Sleep Journey works on iPhone, screen-locked, ending in indefinite brown-noise maintenance.

### M4 — Sourced loops + attribution

- Freesound loops from §6.1 integrated.
- IndexedDB blob cache working end-to-end.
- `/credits` route with attribution copy from §6.5.
- Optional atmospheres (wind, forest, thunder) added.
- **Done when:** all CC-BY attribution is rendered and `/credits` is reachable from Settings.

### M5 — Polish

- iPad layout (11.3).
- Full accessibility audit (12).
- Lighthouse perf audit (13).
- Reduced-motion variant.
- Hardened loudness cap (14.3).
- Wipe-data button (14.4).
- **Done when:** Lighthouse PWA ≥ 90, Accessibility ≥ 95 on iPad Pro 11" emulation.

### Post-M5 — Stretch

- Capacitor wrapper for App Store distribution if iOS 26 PWA regressions persist.
- Smart alarm research (using FFR/ASSR timing — needs design spike).
- Watch companion (later).

---

## 16. Open Questions for Follow-up

These are explicitly **not** answered in v1 and need a design spike or external input before being committed.

1. **Sleep timer cap.** Hard cap at 8 h to protect battery and prevent infinite brown-noise maintenance? Or let user-set up to 12 h?
2. **"Smart alarm" feature.** Could the 40 Hz / gamma band be used as a wake signal that interacts with the ascending sleep cycle? Needs literature review (ASSR waking research) and is **out of scope for v1**.
3. **Capacitor vs pure PWA.** If iOS 26 PWA regressions (Bugs 291892, 295518) persist into iOS 27, we wrap with Capacitor for an App Store release. Decision deferred to M5.
4. **Personalization.** Should the app learn the user's preferred stage durations and adapt over time? Privacy implications (§14.1) — deferred.
5. **Multi-user / profiles.** Out of scope for v1; localStorage is per-origin, no sync.
6. **Color theme integration.** Should the app auto-pick its theme from the OS, the Omarchy shell theme (if detected), or always default to dark for sleep contexts?
7. **Loop normalization policy.** Should we apply a soft limiter to all loops at decode time, or rely on the source files? TBD in M4.
8. **Health disclaimers in non-English locales.** §14.5 is English-only; need legal review for non-US release.
9. **Apple Watch / CarPlay.** Stretch goals only.
10. **Cross-app sleep data export.** Apple Health / Google Fit integration is **explicitly out of scope** for v1 (privacy).
11. **Custom domain (CNAME).** User is bringing a CNAME for production hosting. Exact TBD; affects §7.1 (which already commits to CNAME-on-gh-pages shape regardless). Set domain in repo Settings → Pages after first deploy; `CNAME` file is auto-maintained by GitHub.
12. **iOS re-install choreography on manifest-breaking changes.** §7.3 lists what cannot change without a re-install. We need a one-pager in `/about` explaining "if your app looks stale, swipe it away and re-tap the icon" — to be written in M5.

---

## Appendix A — Source-of-truth files

- Source spec: `/mnt/hgfs/OMARCHY_SHARED/binaural_therapy_app_spec.json`
- This document: `~/GitHub/jaybodecode/binaural-therapy/appspec.md`
- Future: `architecture.md`, `attribution.md`, `research-questions.md` to be created in respective milestones.

## Appendix B — Decision log (append-only)

| Date       | Decision                                                                                           | Rationale                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 2026-09-05 | Vue 3 SPA + Vite (not Nuxt)                                                                        | Avoid SSR hydration mismatches with Web Audio APIs.                                                    |
| 2026-09-05 | Native Web Audio (not Tone.js)                                                                     | Cleanest signal path for iOS `<audio>` anchor.                                                         |
| 2026-09-05 | GLM 5.2 primary coding model                                                                       | Best third-party-verified SWE-Bench Pro.                                                               |
| 2026-09-05 | MiniMax M3 fallback                                                                                | Cost-effective for long sessions; 1M context.                                                          |
| 2026-09-05 | Deep literature digest (Garcia-Argibay, Ingendoh, Papalambros, Adaikkan, Linkenkaer-Hansen, Oster) | Justifies defaults; honest caveat per claim.                                                           |
| 2026-09-05 | Freesound CC0/CC-BY for ambient loops                                                              | Asset-free pipeline, attribution-compliant.                                                            |
| 2026-09-05 | iOS `<audio>` MediaStream anchor + `audioSession.type = "playback"`                                | Required to survive screen lock on iOS.                                                                |
| 2026-09-05 | Single repo (`main` source + `gh-pages` dist) with CNAME                                           | Canonical pattern; avoids two-repo overhead. GH Pages reads CNAME from `gh-pages` and provisions cert. |
| 2026-09-05 | Workbox `registerType: 'prompt'` + explicit "Update ready" toast                                   | iOS Home Screen PWA process is sticky; autoUpdate gives stale-code UX. Explicit prompt = predictable.  |
| 2026-09-05 | iOS re-install caveat documented (manifest changes don't auto-apply)                               | Forces discipline around icon/color/start_url changes; baked into §7.3 and §16.                        |
