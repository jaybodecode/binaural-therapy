<script setup lang="ts">
import { RESEARCH_PAPERS } from '@/data/research'
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] px-4 py-6">
    <nav class="mb-4 flex gap-2">
      <RouterLink class="navbtn" to="/">← App</RouterLink>
      <RouterLink class="navbtn navbtn--accent" to="/credits">Credits</RouterLink>
    </nav>

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
      <div v-if="p.doi || p.url" class="mt-2 flex flex-wrap gap-2">
        <a
          v-if="p.doi"
          class="linkbtn"
          :href="'https://doi.org/' + p.doi"
          target="_blank"
          rel="noopener"
        >
          View paper ↗
        </a>
        <a v-if="p.url" class="linkbtn" :href="p.url" target="_blank" rel="noopener">
          Read via archive.org ↗
        </a>
      </div>
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
  @apply inline-flex min-h-touch items-center rounded-lg border border-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] px-3 text-accent;
}
.type-badge {
  background: color-mix(in oklab, var(--color-accent) 16%, transparent);
  color: var(--color-accent-strong);
}
</style>
