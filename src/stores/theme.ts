import { defineStore } from 'pinia'
import { onMounted, ref, watch } from 'vue'

export type Theme = 'auto' | 'night' | 'sepia'

const KEY = 'bt:theme:v1'

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY) as Theme | null
    return v === 'night' || v === 'sepia' || v === 'auto' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

/** Apply palette via a data attribute + color-scheme on the document root.
 * The visual style is always Glass (liquid-glass iOS); only the palette varies. */
function apply(theme: Theme, systemDark: boolean): void {
  const el = document.documentElement
  el.dataset.style = 'glass'
  // Resolve 'auto' to night (dark) or day (light) following the phone profile.
  const resolved = theme === 'auto' ? (systemDark ? 'night' : 'day') : theme
  el.dataset.theme = resolved
  el.style.colorScheme = resolved === 'day' ? 'light' : 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      resolved === 'sepia' ? '#1c1712' : resolved === 'night' ? '#11141c' : '#e8ecf2',
    )
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(readTheme())
  let mq: MediaQueryList | null = null

  const systemDark = (): boolean => mq?.matches ?? true

  onMounted(() => {
    mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(theme.value, systemDark())
  })

  function set(next: Theme) {
    theme.value = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    apply(next, systemDark())
  }

  watch(theme, (t) => apply(t, systemDark()))

  return { theme, set }
})
