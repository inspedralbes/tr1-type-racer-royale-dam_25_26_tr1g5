import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home', // Renombrado de 'index' a 'Home'
    component: Index 
  },
  { 
    path: '/cercador', // Ruta corregida
    name: 'BuscadorExercici', 
    component: () => import('@/pages/BuscadorExercici.vue') 
  },
  { 
    path: '/exercici/:id', // <-- CAMBIADO: necesita un ID
    name: 'Exercici', 
    component: () => import('@/pages/Exercici.vue') 
  },
  { 
    path: '/resultats', 
    name: 'ResultatsExercici', 
    component: () => import('@/pages/ResultatsExercici.vue') 
  },
  // --- RUTA NUEVA ---
  {
    path: '/sessio/:exerciseId', // Ruta para el lobby de una sesión
    name: 'SessioLobby',
    component: () => import('@/pages/SessioLobby.vue'),
    props: true // Esto pasa 'exerciseId' como prop al componente
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
