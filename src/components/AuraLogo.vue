<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    animated?: boolean
    color?: string
  }>(),
  { size: 32, animated: true, color: 'var(--color-accent)' },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Aura"
  >
    <!-- Core "aura" concentric rings (two ears + center, evoking binaural beats) -->
    <g :class="animated ? 'aura-spin' : ''">
      <circle cx="50%" cy="50%" r="22" :stroke="color" stroke-width="2.5" opacity="0.9" />
      <circle cx="50%" cy="50%" r="15" :stroke="color" stroke-width="2" opacity="0.7" />
      <circle cx="50%" cy="50%" r="4" :fill="color" />
    </g>
    <!-- Orbital dot — evokes the second ear carrier -->
    <circle :class="animated ? 'aura-orb' : ''" cx="50%" cy="7" r="2.5" :fill="color" />
  </svg>
</template>

<style scoped>
.aura-spin {
  transform-origin: 50% 50%;
  animation: aura-rotate 12s linear infinite;
}
.aura-orb {
  animation: aura-orbit 12s linear infinite;
  transform-origin: 0 0;
}

@keyframes aura-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes aura-orbit {
  from {
    transform: rotate(0deg) translateY(-30px);
  }
  to {
    transform: rotate(360deg) translateY(-30px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .aura-spin,
  .aura-orb {
    animation: none;
  }
}
</style>
