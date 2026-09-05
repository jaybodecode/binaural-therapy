<script setup lang="ts">
// Ambient sound credits (appspec §6.5). CC0 and CC-BY attributions.
</script>

<template>
  <main class="mx-auto w-full max-w-[640px] px-4 py-6">
    <h1 class="mb-4 text-2xl font-bold">Credits</h1>

    <section class="card mb-4">
      <h2 class="text-lg font-semibold">Ocean Waves</h2>
      <ul class="mt-2 space-y-2 text-sm leading-relaxed">
        <li>
          <span class="font-medium">"Ocean Waves.wav"</span> by Noted451 —
          <a
            class="text-accent underline"
            href="https://freesound.org/people/Noted451/sounds/531015/"
            target="_blank"
            rel="noopener"
          >
            freesound.org/people/Noted451/sounds/531015
          </a>
          <br />
          Public domain (CC0) —
          <a
            class="text-accent underline"
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener"
          >
            creativecommons.org/publicdomain/zero/1.0
          </a>
        </li>
      </ul>
    </section>

    <section class="card mb-4">
      <h2 class="text-lg font-semibold">Synthesized sources</h2>
      <p class="text-muted mt-2 text-sm leading-relaxed">
        Pink noise (1/f), brown noise (1/f²), steady rain, and the ocean surge are generated
        procedurally at runtime — no external assets, no additional attribution required.
        Resting-EEG 1/f rationale: Linkenkaer-Hansen et al. (2001),
        <em>J Neuroscience</em> 21(4):1370.
      </p>
    </section>

    <nav class="mt-6">
      <RouterLink class="text-accent text-sm underline" to="/">← Back to app</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
@reference '../style.css';
</style>
