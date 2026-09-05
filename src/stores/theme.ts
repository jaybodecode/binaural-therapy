import { defineStore } from 'pinia'
import { onMounted, ref, watch } from 'vue'

export type Theme = 'dark' | 'white' | 'sepia'

const KEY = 'bt:theme:v1'

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY) as Theme | null
    return v === 'dark' || v === 'white' || v === 'sepia' ? v : 'dark'
  } catch {
    return 'dark'
  }
}

/** Apply palette via a data attribute + color-scheme on the document root.
 * The visual style is always Glass (liquid-glass iOS); only the palette varies.
 * Dark is the default; White is the light crisp glass; Sepia is warm/pre-sleep. */
function apply(theme: Theme): void {
  const el = document.documentElement
  el.dataset.style = 'glass'
  el.dataset.theme = theme
  el.style.colorScheme = theme === 'white' ? 'light' : 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      theme === 'sepia' ? '#1c1712' : theme === 'dark' ? '#11141c' : '#eef1f6',
    )
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(readTheme())

  onMounted(() => apply(theme.value))

  function set(next: Theme) {
    theme.value = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    apply(next)
  }

  watch(theme, (t) => apply(t))

  return { theme, set }
})
