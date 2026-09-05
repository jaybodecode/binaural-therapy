<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { usePresetsStore } from '@/stores/presets'
import { useThemeStore } from '@/stores/theme'
import { BACKGROUNDS, BANDS, NOISES, getBand } from '@/data/bands'
import { TRANSIT_MODES } from '@/data/transitions'
import AuraLogo from '@/components/AuraLogo.vue'

const REPO_URL = 'https://github.com/jaybodecode/binaural-therapy'

const session = useSessionStore()
const presets = usePresetsStore()
const theme = useThemeStore()
const busy = ref(false)
const presetName = ref('')
const showNamePrompt = ref(false)

async function begin() {
  if (busy.value) return
  busy.value = true
  try {
    await session.unlockAndStart()
  } catch (e) {
    console.error('unlock failed', e)
  } finally {
    busy.value = false
  }
}

function openSavePrompt() {
  presetName.value = ''
  showNamePrompt.value = true
}

function confirmSave() {
  const name = presetName.value.trim() || currentAutoName.value
  presets.add(name, {
    band: session.band,
    beatHz: session.beatHz,
    toneGain: session.toneGain,
    noise: session.noise,
    noiseGain: session.noiseGain,
    background: session.background,
    backgroundGain: session.backgroundGain,
  })
  showNamePrompt.value = false
}

function cancelSave() {
  showNamePrompt.value = false
}

function applyPreset(p: (typeof presets.presets)[number]) {
  session.setBand(p.band)
  session.setNoise(p.noise)
  session.setNoiseGain(p.noiseGain)
  session.setBackground(p.background)
  session.setBackgroundGain(p.backgroundGain)
  session.setToneGain(p.toneGain)
  if (p.beatHz != null) session.setBeat(p.beatHz)
}

const currentAutoName = computed(
  () => `${session.currentBand.name} · ${session.noise} · ${Math.round(session.toneGain * 100)}%`,
)

function shareLink() {
  const qp = new URLSearchParams({
    band: session.band,
    noise: session.noise,
    bg: session.background === 'none' ? '' : session.background,
    tg: String(session.toneGain),
  })
  if (session.beatHz != null) qp.set('beat', String(session.beatHz))
  navigator.clipboard
    .writeText(`${location.origin}${location.pathname}#${qp.toString()}`)
    .then(() => console.log('copied share link'))
    .catch(() => {})
}

const beatMax = computed(() => session.currentBand.beatRange[1])
const beatMin = computed(() => session.currentBand.beatRange[0])
</script>

<template>
  <main class="home">
    <header class="home__header">
      <div class="home__title-row">
        <AuraLogo :size="34" class="shrink-0" />
        <h1 class="home__title">Aura — Binaural Therapy</h1>
      </div>
      <p class="home__subtitle">State-transitioning audio for sleep, focus, and calm.</p>
      <p class="home__links">
        Sound off?
        <RouterLink class="home__linkbtn" to="/credits">Credits</RouterLink>
        <RouterLink class="home__linkbtn" to="/research">Research</RouterLink>
      </p>
    </header>

    <!-- Band selector -->
    <section class="card" aria-labelledby="band-heading">
      <h2 id="band-heading" class="home__section-title">Target state</h2>
      <div class="band-grid">
        <button
          v-for="b in BANDS"
          :key="b.id"
          type="button"
          class="band-card"
          :class="{ 'band-card--active': session.band === b.id }"
          :aria-pressed="session.band === b.id"
          @click="session.setBand(b.id)"
        >
          <span class="band-card__icon" aria-hidden="true">{{ b.icon }}</span>
          <span class="band-card__name">{{ b.name }}</span>
          <span class="band-card__range">{{ b.beatRange[0] }}–{{ b.beatRange[1] }} Hz</span>
        </button>
      </div>
      <p class="band-note">{{ session.currentBand.description }}</p>
      <p class="band-lock">
        Uses <strong>{{ getBand(session.band).preferredNoise }} noise</strong> · beat
        {{ session.effectiveBeat.toFixed(1) }} Hz
      </p>
    </section>

    <!-- Tone volume -->
    <section class="card" aria-labelledby="tone-vol-heading">
      <h2 id="tone-vol-heading" class="home__section-title">Tone volume</h2>
      <div class="field">
        <div class="field__label">
          <span>Entrainment tone level</span>
          <output>{{ (session.toneGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          :value="session.toneGain"
          @input="session.setToneGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </section>

    <!-- Noise (brown/pink) — locked to band by default -->
    <section class="card" aria-labelledby="noise-heading">
      <h2 id="noise-heading" class="home__section-title">
        Noise <span class="heading-tag">matched to your state</span>
      </h2>
      <div class="atmos-grid">
        <button
          v-for="n in NOISES"
          :key="n.id"
          type="button"
          class="atmos-card"
          :class="{
            'atmos-card--active': session.noise === n.id,
            'atmos-card--locked': session.noise !== n.id,
          }"
          :aria-pressed="session.noise === n.id"
          @click="session.setNoise(n.id)"
        >
          <span class="atmos-card__label">{{ n.label }}</span>
          <span class="atmos-card__desc">{{ n.description }}</span>
        </button>
      </div>
      <p class="muted-note">
        {{
          session.noise === session.lockedNoise
            ? `Auto-set to ${getBand(session.band).preferredNoise} for ${session.currentBand.name}.`
            : `Using ${session.noise} (overridden).`
        }}
      </p>
      <div class="field mt-2">
        <div class="field__label">
          <span>Noise volume</span>
          <output>{{ (session.noiseGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          :value="session.noiseGain"
          @input="session.setNoiseGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </section>

    <!-- Background ambiences (rain/ocean) — independent layer -->
    <section class="card" aria-labelledby="background-heading">
      <h2 id="background-heading" class="home__section-title">Background ambience</h2>
      <div class="atmos-grid">
        <button
          type="button"
          class="atmos-card"
          :class="{ 'atmos-card--active': session.background === 'none' }"
          :aria-pressed="session.background === 'none'"
          @click="session.setBackground('none')"
        >
          <span class="atmos-card__label">None</span>
          <span class="atmos-card__desc">No background layer.</span>
        </button>
        <button
          v-for="b in BACKGROUNDS"
          :key="b.id"
          type="button"
          class="atmos-card"
          :class="{ 'atmos-card--active': session.background === b.id }"
          :aria-pressed="session.background === b.id"
          @click="session.setBackground(b.id)"
        >
          <span class="atmos-card__label">{{ b.label }}</span>
          <span class="atmos-card__desc">{{ b.description }}</span>
        </button>
      </div>
      <div class="field mt-2">
        <div class="field__label">
          <span>Background volume</span>
          <output>{{ (session.backgroundGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          v-if="session.background !== 'none'"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          :value="session.backgroundGain"
          @input="session.setBackgroundGain(Number(($event.target as HTMLInputElement).value))"
        />
        <p v-else class="muted-note">Pick a background to enable volume.</p>
      </div>
    </section>

    <!-- State-transition mode -->
    <section class="card" aria-labelledby="transit-heading">
      <h2 id="transit-heading" class="home__section-title">Session mode</h2>
      <p class="muted-note">
        Choose how Aura moves between states over time. Pick a mode, then press a band above — the
        beat will ramp through the states automatically.
      </p>
      <div class="transit-grid">
        <button
          v-for="tm in TRANSIT_MODES"
          :key="tm.id"
          type="button"
          class="transit-card"
          :class="{ 'transit-card--active': session.transitMode === tm.id }"
          :aria-pressed="session.transitMode === tm.id"
          @click="session.setTransitMode(tm.id)"
        >
          <span class="transit-card__label">{{ tm.label }}</span>
          <span class="transit-card__desc">{{ tm.description }}</span>
        </button>
      </div>
      <p v-if="session.transitMode !== 'state-lock'" class="muted-note">
        Transition will begin when you tap the play button below.
      </p>
    </section>

    <!-- Beat slider -->
    <section class="card" aria-labelledby="beat-heading">
      <h2 id="beat-heading" class="home__section-title">Beat frequency</h2>
      <div class="field">
        <div class="field__label">
          <span>{{ session.currentBand.name }} ({{ beatMin }}–{{ beatMax }} Hz)</span>
          <output>{{ session.effectiveBeat.toFixed(1) }} Hz</output>
        </div>
        <input
          type="range"
          :min="beatMin"
          :max="beatMax"
          step="0.5"
          :value="session.effectiveBeat"
          class="slider"
          @input="session.setBeat(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <p class="muted-note">Micro-tuning of the binaural beat inside your chosen state.</p>
    </section>

    <!-- Spatial / Surround (PannerMode) -->
    <section class="card" aria-labelledby="spatial-heading">
      <h2 id="spatial-heading" class="home__section-title">Ambient space</h2>
<p class="muted-note">
        Spread the noise &amp; background sound around your head (use headphones). The binaural tone
        stays safely hard-panned. Pick Surround or Drift, then play — you'll hear the ambience move.
      </p>
      <div class="chip-row mt-2">
        <button
          v-for="(label, key) in { off: 'Off', surround: 'Surround', drift: 'Drift' }"
          :key="key"
          type="button"
          class="chip"
          :class="{ 'chip--active': session.spatial.mode === key }"
          :aria-pressed="session.spatial.mode === key"
          @click="session.setSpatial({ mode: key as 'off' | 'surround' | 'drift' })"
        >
          {{ label }}
        </button>
      </div>

      <div v-if="session.spatial.mode !== 'off'" class="mt-3">
        <div class="field">
          <div class="field__label">
            <span>Azimuth (left–right)</span>
            <output>{{ session.spatial.azimuth }}°</output>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            :value="session.spatial.azimuth"
            class="slider"
            @input="
              session.setSpatial({ azimuth: Number(($event.target as HTMLInputElement).value) })
            "
          />
        </div>
        <div class="field">
          <div class="field__label">
            <span>Elevation (up–down)</span>
            <output>{{ session.spatial.elevation }}°</output>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            step="5"
            :value="session.spatial.elevation"
            class="slider"
            @input="
              session.setSpatial({ elevation: Number(($event.target as HTMLInputElement).value) })
            "
          />
        </div>
        <template v-if="session.spatial.mode === 'drift'">
          <div class="field">
            <div class="field__label">
              <span>Wander radius</span>
              <output>{{ session.spatial.wanderRadius }}°</output>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              :value="session.spatial.wanderRadius"
              class="slider"
              @input="
                session.setSpatial({
                  wanderRadius: Number(($event.target as HTMLInputElement).value),
                })
              "
            />
          </div>
          <div class="field">
            <div class="field__label">
              <span>Drift speed</span>
              <output>{{ session.spatial.driftSpeed }}</output>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              :value="session.spatial.driftSpeed"
              class="slider"
              @input="
                session.setSpatial({
                  driftSpeed: Number(($event.target as HTMLInputElement).value),
                })
              "
            />
          </div>
        </template>
      </div>
    </section>

    <!-- Headphone check -->
    <section class="card" aria-labelledby="stereo-heading">
      <h2 id="stereo-heading" class="home__section-title">Headphone check</h2>
      <p class="muted-note">
        You need headphones for binaural beats to work. One ear must not hear the speaker of the
        other ear.
      </p>
      <div class="btn-row">
        <button
          type="button"
          class="btn-secondary"
          :disabled="!session.canPlay"
          @click="session.pingChannel('left')"
        >
          Ping Left
        </button>
        <button
          type="button"
          class="btn-secondary"
          :disabled="!session.canPlay"
          @click="session.pingChannel('right')"
        >
          Ping Right
        </button>
      </div>
    </section>

    <!-- Presets -->
    <section class="card" aria-labelledby="presets-heading">
      <h2 id="presets-heading" class="home__section-title">Presets</h2>
      <p class="muted-note">Current: {{ currentAutoName }}</p>
      <div class="preset-save">
        <button type="button" class="btn-secondary flex-1" @click="openSavePrompt">
          Save current
        </button>
        <button type="button" class="btn-secondary" @click="shareLink">Share</button>
      </div>

      <form v-if="showNamePrompt" class="preset-name-form" @submit.prevent="confirmSave">
        <input
          v-model="presetName"
          type="text"
          class="text-input"
          :placeholder="currentAutoName"
          aria-label="Preset name"
          autofocus
        />
        <div class="preset-name-actions">
          <button type="submit" class="btn-primary">Save</button>
          <button type="button" class="btn-secondary" @click="cancelSave">Cancel</button>
        </div>
      </form>

      <ul v-if="presets.presets.length" class="preset-list">
        <li v-for="p in presets.presets" :key="p.id" class="preset-item">
          <button type="button" class="preset-item__load" @click="applyPreset(p)">
            <span class="preset-item__name">{{ p.name }}</span>
            <span class="preset-item__meta"
              >{{ p.band }} · {{ p.noise
              }}{{ p.background && p.background !== 'none' ? ` + ${p.background}` : '' }}</span
            >
          </button>
          <button
            type="button"
            class="preset-item__del"
            aria-label="Delete preset"
            @click="presets.remove(p.id)"
          >
            ✕
          </button>
        </li>
      </ul>
    </section>

    <!-- Theme (at end) -->
    <section class="card" aria-labelledby="theme-heading">
      <h2 id="theme-heading" class="home__section-title">Theme</h2>
      <div class="chip-row">
        <button
          v-for="t in ['auto', 'dark', 'sepia-night'] as const"
          :key="t"
          type="button"
          class="chip"
          :class="{ 'chip--active': theme.theme === t }"
          @click="theme.set(t)"
        >
          {{ t === 'sepia-night' ? 'Sepia Night' : t[0].toUpperCase() + t.slice(1) }}
        </button>
      </div>
    </section>

    <!-- Primary CTA -->
    <div class="cta-wrap">
      <button
        v-if="!session.isPlaying"
        type="button"
        class="btn-primary w-full"
        :disabled="busy"
        @click="begin"
      >
        {{ busy ? 'Starting…' : session.canPlay ? 'Resume' : 'Tap to begin' }}
      </button>
      <button v-else type="button" class="btn-secondary w-full" @click="session.stop">Stop</button>
    </div>

    <!-- Footer / support -->
    <footer class="home__footer">
      <a :href="REPO_URL" target="_blank" rel="noopener" class="home__support">
        <svg class="home__star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M12 2l2.9 6.07 6.6.9-4.8 4.64 1.16 6.5L12 17.2 6.14 20.1l1.16-6.5L2.5 8.97l6.6-.9z"
            fill="currentColor"
          />
        </svg>
        <span>
          Please star our project on GitHub to
          <span class="home__love" aria-hidden="true">❤</span>
          support our free app!
        </span>
      </a>
    </footer>
  </main>
</template>

<style scoped>
@reference '../style.css';

.home {
  @apply mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 py-6;
}
.home__header {
  @apply flex flex-col gap-2;
}
.home__title-row {
  @apply flex items-center gap-3;
}
.home__title {
  @apply text-3xl font-bold tracking-tight;
}
.home__subtitle {
  @apply text-muted text-base;
}
.home__links {
  @apply flex items-center gap-2 text-muted text-xs;
}
.home__linkbtn {
  @apply inline-flex min-h-touch items-center rounded-lg border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_97%,white_3%)] px-3 text-fg transition-colors;
}
.home__linkbtn:hover {
  @apply border-accent;
}

.home__footer {
  @apply mt-2 flex justify-center pb-2;
}
.home__support {
  @apply inline-flex items-center gap-2 text-muted text-xs leading-relaxed;
}
.home__star {
  animation: star-shimmer 2.4s ease-in-out infinite;
  color: #f0c14b;
}
.home__love {
  color: #f06b6b;
  animation: love-pulse 2.4s ease-in-out infinite;
}

@keyframes star-shimmer {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}
@keyframes love-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}

.home__section-title {
  @apply text-fg mb-2 text-lg font-semibold;
}
.heading-tag {
  @apply text-muted text-xs font-normal;
}

.band-grid {
  @apply grid grid-cols-3 gap-2 sm:grid-cols-5;
}
.band-card {
  @apply flex flex-col items-center gap-1 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_96%,white_4%)] p-3 text-center transition-colors;
}
.band-card--active {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)];
}
.band-card__icon {
  @apply text-2xl;
}
.band-card__name {
  @apply text-fg text-sm font-semibold;
}
.band-card__range {
  @apply text-muted text-[0.7rem];
}
.band-note {
  @apply text-fg mt-2 text-sm leading-relaxed;
}
.band-lock {
  @apply text-muted mt-1 text-xs;
}

.atmos-grid {
  @apply grid grid-cols-2 gap-2;
}
.atmos-card {
  @apply flex flex-col gap-0.5 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_96%,white_4%)] p-3 text-left transition-colors;
}
.atmos-card--active {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)];
}
.atmos-card--locked {
  opacity: 0.5;
}
.atmos-card__label {
  @apply text-fg text-sm font-semibold;
}
.atmos-card__desc {
  @apply text-muted text-xs leading-snug;
}

.transit-grid {
  @apply mt-2 grid grid-cols-1 gap-2;
}
.transit-card {
  @apply flex flex-col gap-0.5 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_96%,white_4%)] p-3 text-left transition-colors;
}
.transit-card--active {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)];
}
.transit-card__label {
  @apply text-fg text-sm font-semibold;
}
.transit-card__desc {
  @apply text-muted text-xs leading-snug;
}

.field {
  @apply mb-4 flex flex-col gap-1;
}
.field__label {
  @apply flex items-center justify-between text-fg text-sm;
}
.field__label output {
  @apply text-muted font-mono text-xs;
}
.slider {
  @apply w-full;
}
.muted-note {
  @apply text-muted mt-1 text-xs;
}

.chip-row {
  @apply flex flex-wrap gap-2;
}
.chip {
  @apply rounded-card border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] px-3 py-1 text-sm transition-colors;
}
.chip--active {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-fg;
}

.btn-row {
  @apply mt-2 flex gap-2;
}
.btn-row > button {
  @apply flex-1;
}

.preset-save {
  @apply flex gap-2;
}
.preset-name-form {
  @apply mt-2 flex flex-col gap-2;
}
.preset-name-actions {
  @apply flex gap-2;
}
.text-input {
  @apply flex-1 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_20%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_97%,white_3%)] px-3 py-2 text-fg;
}
.preset-list {
  @apply mt-2 flex list-none flex-col gap-1 p-0;
}
.preset-item {
  @apply flex items-center gap-1 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_10%,transparent)] p-1;
}
.preset-item__load {
  @apply flex flex-1 flex-col items-start px-2 py-1 text-left;
}
.preset-item__name {
  @apply text-fg text-sm font-medium;
}
.preset-item__meta {
  @apply text-muted text-xs;
}
.preset-item__del {
  @apply px-2 text-muted;
}

.cta-wrap {
  @apply sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-10 pb-2;
}
</style>
