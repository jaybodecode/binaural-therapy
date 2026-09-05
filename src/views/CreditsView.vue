<script setup lang="ts">
// Ambient sound credits (appspec §6.5). CC0 and CC-BY attributions.
</script>

<template>
  <main class="mx-auto w-full max-w-[640px] px-4 py-6">
    <nav class="mb-4 flex gap-2">
      <RouterLink class="navbtn" to="/">← App</RouterLink>
      <RouterLink class="navbtn navbtn--accent" to="/research">Research</RouterLink>
    </nav>

    <h1 class="mb-4 text-2xl font-bold">Credits</h1>

    <section class="card mb-4">
      <h2 class="text-lg font-semibold">Ocean Waves</h2>
      <ul class="mt-2 space-y-2 text-sm leading-relaxed">
        <li>
          <span class="font-medium">"Ocean Waves.wav"</span> by Noted451
          <a
            class="linkbtn"
            href="https://freesound.org/people/Noted451/sounds/531015/"
            target="_blank"
            rel="noopener"
          >
            View on Freesound ↗
          </a>
          <span class="text-muted">· Public domain (CC0)</span>
          <a
            class="linkbtn"
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener"
          >
            CC0 license ↗
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

    <section class="card mb-4">
      <h2 class="text-lg font-semibold">Research</h2>
      <p class="text-muted mt-2 text-sm leading-relaxed">
        The six references grounding our design defaults — efficacy of binaural beats
        (Garcia-Argibay 2019), EEG-entrainment evidence (Ingendoh 2023), pink-noise slow-wave
        enhancement (Papalambros 2017), 40 Hz neuroprotection (Adaikkan 2019), 1/f resting-EEG
        scaling (Linkenkaer-Hansen 2001), and the foundational account (Oster 1973).
      </p>
      <RouterLink class="linkbtn mt-2" to="/research">Read the papers →</RouterLink>
    </section>
  </main>
</template>

<style scoped>
@reference '../style.css';

.navbtn {
  @apply inline-flex min-h-touch items-center rounded-lg border border-[color-mix(in_oklab,var(--color-fg)_15%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_97%,white_3%)] px-4 text-fg;
}
.navbtn--accent {
  @apply border-accent bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)];
}
.linkbtn {
  @apply mt-1 inline-flex min-h-touch items-center rounded-lg border border-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] px-3 text-accent;
}
</style>
