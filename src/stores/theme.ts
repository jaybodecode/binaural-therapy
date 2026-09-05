import { defineStore } from 'pinia'
import { onMounted, ref, watch } from 'vue'

export type Theme = 'auto' | 'dark' | 'sepia-night'

const KEY = 'bt:theme:v1'

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY) as Theme | null
    return v === 'dark' || v === 'sepia-night' || v === 'auto' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

/** Apply theme as a data attribute + color-scheme on the document root. */
function applyTheme(theme: Theme, systemDark: boolean): void {
  const el = document.documentElement
  const themeColor = document.querySelector('meta[name="theme-color"]')

  if (theme === 'auto') {
    el.dataset.theme = systemDark ? 'dark' : 'dark' // app stays dark by default
  } else {
    el.dataset.theme = theme
  }
  el.style.colorScheme = 'dark'

  if (themeColor) {
    themeColor.setAttribute('content', el.dataset.theme === 'sepia-night' ? '#191510' : '#0b0d10')
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(read())
  let mq: MediaQueryList | null = null

  const prefersDark = (): boolean => mq?.matches ?? true

  onMounted(() => {
    mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(theme.value, prefersDark())
  })

  function set(next: Theme) {
    theme.value = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    applyTheme(next, prefersDark())
  }

  watch(theme, (t) => applyTheme(t, prefersDark()))

  return { theme, set }
})
