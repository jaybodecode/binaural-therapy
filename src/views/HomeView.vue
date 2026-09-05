<script setup lang="ts">
import { ref } from 'vue'

const greeting = ref('Tap to begin a session.')
const isStarting = ref(false)
const audioUnlocked = ref(false)

async function startSession() {
  if (isStarting.value) return
  isStarting.value = true
  try {
    // M0 placeholder. M1 wires the real StartGate per appspec.md §8.6
    // (AudioContext unlock inside the click handler) and §8.3
    // (MediaStream destination into a hidden <audio>).
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const ctx = new AudioContext()
      await ctx.resume()
      audioUnlocked.value = ctx.state === 'running'
      greeting.value = audioUnlocked.value
        ? 'Audio context unlocked. M1 will wire the real engine.'
        : `Audio state: ${ctx.state}. Check §8.6 if unexpected.`
    } else {
      greeting.value = 'Web Audio API not available in this browser.'
    }
  } catch (err) {
    greeting.value = `Unlock failed: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    isStarting.value = false
  }
}
</script>

<template>
  <main class="home">
    <header class="home__header">
      <h1 class="home__title">Binaural Therapy</h1>
      <p class="home__subtitle">State-transitioning audio for sleep, focus, and calm.</p>
    </header>

    <section class="home__cta card" aria-labelledby="cta-heading">
      <h2 id="cta-heading" class="visually-hidden">Start a session</h2>
      <p class="home__hint">
        {{ greeting }}
      </p>
      <button type="button" class="btn-primary w-full" :disabled="isStarting" @click="startSession">
        <span v-if="isStarting">Starting…</span>
        <span v-else>Tap to begin</span>
      </button>
      <p v-if="audioUnlocked" class="home__status" role="status">Audio context state: running</p>
    </section>

    <section class="home__roadmap" aria-labelledby="roadmap-heading">
      <h2 id="roadmap-heading" class="home__section-title">M0 placeholder</h2>
      <p>
        This is the M0 scaffold. Real functionality ships in subsequent milestones (see
        <code>appspec.md §15</code>).
      </p>
      <ul>
        <li>M1 — State Lock end-to-end</li>
        <li>M2 — Full catalogue &amp; presets</li>
        <li>M3 — Sleep Journey</li>
        <li>M4 — Sourced loops &amp; credits</li>
        <li>M5 — Polish</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
@reference '../style.css';

.home {
  @apply mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-6;
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

.home__cta {
  @apply flex flex-col gap-4;
}

.home__hint {
  @apply text-muted text-sm leading-relaxed;
}

.home__status {
  @apply text-success text-sm;
}

.home__roadmap {
  @apply flex flex-col gap-2;
}

.home__section-title {
  @apply text-fg text-lg font-semibold;
}

.home__roadmap ul {
  @apply text-muted list-disc pl-5 text-sm leading-relaxed;
}
</style>
