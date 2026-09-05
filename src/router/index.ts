import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Aura — Binaural Therapy' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About · Aura' },
  },
  {
    path: '/credits',
    name: 'credits',
    component: () => import('@/views/CreditsView.vue'),
    meta: { title: 'Credits · Aura' },
  },
  {
    path: '/research',
    name: 'research',
    component: () => import('@/views/ResearchView.vue'),
    meta: { title: 'Research · Aura' },
  },
  {
    // 404 fallback to home
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta?.title as string | undefined) ?? 'Aura'
  document.title = title
})
