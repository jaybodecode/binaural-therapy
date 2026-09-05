import { defineStore } from 'pinia'
import { onMounted, ref, watch } from 'vue'

export type Theme = 'auto' | 'dark' | 'sepia-night'
export type ThemeStyle = 'classic' | 'glass' | 'psych'

const KEY = 'bt:theme:v1'
const STYLE_KEY = 'bt:theme-style:v1'

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY) as Theme | null
    return v === 'dark' || v === 'sepia-night' || v === 'auto' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function readStyle(): ThemeStyle {
  try {
    const v = localStorage.getItem(STYLE_KEY) as ThemeStyle | null
    return v === 'glass' || v === 'psych' || v === 'classic' ? v : 'classic'
  } catch {
    return 'classic'
  }
}

/** Apply palette theme + visual style via data attributes on the root. */
function apply(theme: Theme, style: ThemeStyle, systemDark: boolean): void {
  const el = document.documentElement
  el.dataset.theme = theme === 'auto' ? (systemDark ? 'dark' : 'dark') : theme
  el.dataset.style = style
  el.style.colorScheme = 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const bg =
      style === 'psych' ? '#1a0b2e' : el.dataset.theme === 'sepia-night' ? '#191510' : '#0b0d10'
    meta.setAttribute('content', bg)
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(readTheme())
  const style = ref<ThemeStyle>(readStyle())
  let mq: MediaQueryList | null = null

  const prefersDark = (): boolean => mq?.matches ?? true

  onMounted(() => {
    mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(theme.value, style.value, prefersDark())
  })

  function set(next: Theme) {
    theme.value = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    apply(next, style.value, prefersDark())
  }

  function setStyle(next: ThemeStyle) {
    style.value = next
    try {
      localStorage.setItem(STYLE_KEY, next)
    } catch {
      /* ignore */
    }
    apply(theme.value, next, prefersDark())
  }

  watch(theme, (t) => apply(t, style.value, prefersDark()))
  watch(style, (s) => apply(theme.value, s, prefersDark()))

  return { theme, style, set, setStyle }
})
