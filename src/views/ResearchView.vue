<script setup lang="ts">
import { RESEARCH_PAPERS } from '@/data/research'
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] px-4 py-6">
    <h1 class="mb-1 text-2xl font-bold">Research</h1>
    <p class="text-muted mb-6 text-sm">
      The references behind our default design choices. Summaries are condensed from
      <code>appspec.md §3</code>; caveats matter — see each paper's full text for limits.
    </p>

    <section v-for="p in RESEARCH_PAPERS" :key="p.id" class="card mb-4">
      <header class="mb-1 flex items-start justify-between gap-2">
        <h2 class="text-base font-semibold leading-snug">{{ p.title }}</h2>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium type-badge">
          {{ p.type }}
        </span>
      </header>
      <p class="text-muted text-sm leading-snug">
        {{ p.authors }} — {{ p.journal }} ({{ p.year }})
      </p>
      <p class="mt-2 text-sm leading-relaxed">{{ p.summary }}</p>
      <p v-if="p.doi || p.url" class="mt-2 text-xs">
        <a
          v-if="p.doi"
          class="text-accent underline"
          :href="'https://doi.org/' + p.doi"
          target="_blank"
          rel="noopener"
          >DOI: {{ p.doi }}</a
        >
        <a v-if="p.url" class="text-accent underline" :href="p.url" target="_blank" rel="noopener"
          >Read via archive.org</a
        >
      </p>
    </section>

    <nav class="mt-6 flex gap-4">
      <RouterLink class="text-accent text-sm underline" to="/">← App</RouterLink>
      <RouterLink class="text-accent text-sm underline" to="/credits">Credits</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
@reference '../style.css';

.type-badge {
  background: color-mix(in oklab, var(--color-accent) 16%, transparent);
  color: var(--color-accent-strong);
}
</style>
