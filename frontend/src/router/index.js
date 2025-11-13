import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'

const routes = [
  { path: '/', name: 'Home', component: Index },

  { path: '/login', name: 'Login', component: () => import('@/pages/login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/pages/register.vue') },

  { path: '/cercador', name: 'BuscadorExercici', component: () => import('@/pages/BuscadorExercici.vue') },
  { path: '/exercici/:id', name: 'Exercici', component: () => import('@/pages/Exercici.vue'), props: true },
  { path: '/resultats', name: 'ResultatsExercici', component: () => import('@/pages/ResultatsExercici.vue') },

  { path: '/sessio/:exerciseId', name: 'SessioLobby', component: () => import('@/pages/SessioLobby.vue'), props: true },

  { name: 'SalaEspera', path: '/exercici/:id/espera', component: () => import('@/pages/SalaEspera.vue'), props: true },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// (Opcional) Protegir rutes
const PUBLIC = new Set(['Home','Login','Register','BuscadorExercici'])
router.beforeEach((to) => {
  const token = localStorage.getItem('fitcam_token')
  if (!token && !PUBLIC.has(to.name)) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
