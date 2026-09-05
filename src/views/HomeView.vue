<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { usePresetsStore } from '@/stores/presets'
import { useThemeStore } from '@/stores/theme'
import { ATMOSPHERES, BANDS, getBand } from '@/data/bands'

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
    atmosphere: session.atmosphere,
    toneGain: session.toneGain,
    atmosphereGain: session.atmosphereGain,
    beatHz: session.beatHz,
  })
  showNamePrompt.value = false
}

function cancelSave() {
  showNamePrompt.value = false
}

function applyPreset(p: (typeof presets.presets)[number]) {
  session.setBand(p.band)
  session.setAtmosphere(p.atmosphere)
  session.setToneGain(p.toneGain)
  session.setAtmosphereGain(p.atmosphereGain)
  if (p.beatHz != null) session.setBeat(p.beatHz)
}

const currentAutoName = computed(
  () =>
    `${session.currentBand.name} · ${session.atmosphere} · ${Math.round(session.toneGain * 100)}%`,
)

function shareLink() {
  const qp = new URLSearchParams({
    band: session.band,
    atmos: session.atmosphere,
    tg: String(session.toneGain),
    ag: String(session.atmosphereGain),
  })
  if (session.beatHz != null) qp.set('beat', String(session.beatHz))
  navigator.clipboard
    .writeText(`${location.origin}${location.pathname}#${qp.toString()}`)
    .then(() => console.log('copied share link'))
    .catch(() => {})
}

const beatMax = computed(() => session.currentBand.beatRange[1])
const beatMin = computed(() => session.currentBand.beatRange[0])

/** Noise-type atmospheres (settable, currently locked to band by default). */
const noiseAtmos = ATMOSPHERES.filter((a) => a.kind === 'Noise')
/** Background ambiences (rain/ocean). */
const backgroundAtmos = ATMOSPHERES.filter((a) => a.kind === 'Background')
</script>

<template>
  <main class="home">
    <header class="home__header">
      <h1 class="home__title">Binaural Therapy</h1>
      <p class="home__subtitle">State-transitioning audio for sleep, focus, and calm.</p>
      <p class="home__links">
        Sound off?
        <RouterLink class="home__link" to="/credits">Credits</RouterLink>
        ·
        <RouterLink class="home__link" to="/research">Research</RouterLink>
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
        Uses
        <strong>{{ getBand(session.band).preferredAtmosphere }} noise</strong> + beat
        {{ session.effectiveBeat.toFixed(1) }} Hz
      </p>
    </section>

    <!-- Volume: Entrainment tone -->
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
          v-for="a in noiseAtmos"
          :key="a.id"
          type="button"
          class="atmos-card"
          :class="{
            'atmos-card--active': session.atmosphere === a.id,
            'atmos-card--locked': session.atmosphere !== a.id,
          }"
          :aria-pressed="session.atmosphere === a.id"
          @click="session.setAtmosphere(a.id)"
        >
          <span class="atmos-card__label">{{ a.label }}</span>
          <span class="atmos-card__desc">{{ a.description }}</span>
        </button>
      </div>
      <p class="muted-note">
        {{
          session.atmosphere === session.lockedAtmosphere
            ? `Auto-set to ${getBand(session.band).preferredAtmosphere} for ${session.currentBand.name}.`
            : `Using ${session.atmosphere} (overridden).`
        }}
      </p>
      <div class="field mt-2">
        <div class="field__label">
          <span>Noise volume</span>
          <output>{{ (session.atmosphereGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          v-if="session.atmosphereGain >= 0 && session.atmosphereGain <= 1"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          :value="session.atmosphereGain"
          @input="session.setAtmosphereGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </section>

    <!-- Background ambiences (rain/ocean) -->
    <section class="card" aria-labelledby="background-heading">
      <h2 id="background-heading" class="home__section-title">Background ambience</h2>
      <div class="atmos-grid">
        <button
          v-for="a in backgroundAtmos"
          :key="a.id"
          type="button"
          class="atmos-card"
          :class="{ 'atmos-card--active': session.atmosphere === a.id }"
          :aria-pressed="session.atmosphere === a.id"
          @click="session.setAtmosphere(a.id)"
        >
          <span class="atmos-card__label">{{ a.label }}</span>
          <span class="atmos-card__desc">{{ a.description }}</span>
        </button>
      </div>
      <p class="muted-note">
        Selecting a background ambient overrides the locked noise while active.
      </p>
      <div class="field mt-2">
        <div class="field__label">
          <span>Background volume</span>
          <output>{{ (session.atmosphereGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          v-if="session.atmosphereGain >= 0 && session.atmosphereGain <= 1"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          :value="session.atmosphereGain"
          @input="session.setAtmosphereGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
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
        Spread the background sound around your head (use headphones). The binaural tone stays
        safely hard-panned.
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
            <span class="preset-item__meta">{{ p.band }} · {{ p.atmosphere }}</span>
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
.home__title {
  @apply text-3xl font-bold tracking-tight;
}
.home__subtitle {
  @apply text-muted text-base;
}
.home__links {
  @apply text-muted text-xs;
}
.home__link {
  @apply text-accent underline;
}
.home__section-title {
  @apply text-fg mb-2 text-lg font-semibold;
}
.heading-tag {
  @apply text-muted text-xs font-normal;
}

.band-grid {
  @apply grid grid-cols-5 gap-2;
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
