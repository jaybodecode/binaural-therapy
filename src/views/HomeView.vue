<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { BANDS, ATMOSPHERES } from '@/data/bands'

const session = useSessionStore()
const busy = ref(false)

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
</script>

<template>
  <main class="home">
    <header class="home__header">
      <h1 class="home__title">Binaural Therapy</h1>
      <p class="home__subtitle">State-transitioning audio for sleep, focus, and calm.</p>
    </header>

    <!-- Band selector -->
    <section class="card" aria-labelledby="band-heading">
      <h2 id="band-heading" class="visually-hidden">Choose a brainwave band</h2>
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
      <p class="band-note">{{ session.currentBand.note }}</p>
    </section>

    <!-- Atmosphere picker -->
    <section class="card" aria-labelledby="atmos-heading">
      <h2 id="atmos-heading" class="home__section-title">Background</h2>
      <div class="atmos-grid">
        <button
          v-for="a in ATMOSPHERES"
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
    </section>

    <!-- Controls -->
    <section class="card" aria-labelledby="controls-heading">
      <h2 id="controls-heading" class="home__section-title">Controls</h2>

      <div class="field">
        <div class="field__label">
          <span>Entrainment tone level</span>
          <output>{{ (session.toneGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          v-model.number="session.toneGain"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          aria-valuetext="{{ (session.toneGain * 100).toFixed(0) }} percent"
          @input="session.setToneGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div class="field">
        <div class="field__label">
          <span>Background atmosphere level</span>
          <output>{{ (session.atmosphereGain * 100).toFixed(0) }}%</output>
        </div>
        <input
          v-model.number="session.atmosphereGain"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="slider"
          aria-valuetext="{{ (session.atmosphereGain * 100).toFixed(0) }} percent"
          @input="session.setAtmosphereGain(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <p class="muted-note">
        Carrier {{ session.currentBand.carrierHz }} Hz · Beat
        {{ session.effectiveBeat.toFixed(1) }} Hz
      </p>
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
.home__section-title {
  @apply text-fg text-lg font-semibold mb-2;
}

/* Band grid */
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
  @apply text-muted mt-2 text-xs leading-relaxed;
}

/* Atmosphere grid */
.atmos-grid {
  @apply grid grid-cols-2 gap-2;
}
.atmos-card {
  @apply flex flex-col gap-0.5 rounded-card border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_96%,white_4%)] p-3 text-left transition-colors;
}
.atmos-card--active {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)];
}
.atmos-card__label {
  @apply text-fg text-sm font-semibold;
}
.atmos-card__desc {
  @apply text-muted text-xs leading-snug;
}

/* Sliders */
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

.cta-wrap {
  @apply sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-10 pb-2;
}
</style>
