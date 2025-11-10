import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home',
    component: Index 
  },
  { 
    path: '/cercador',
    name: 'BuscadorExercici', 
    component: () => import('@/pages/BuscadorExercici.vue') 
  },
  { 
    path: '/exercici/:id',
    name: 'Exercici', 
    component: () => import('@/pages/Exercici.vue') 
  },
  { 
    path: '/resultats', 
    name: 'ResultatsExercici', 
    component: () => import('@/pages/ResultatsExercici.vue') 
  },
  {
    path: '/sessio/:exerciseId', // Ruta para el lobby de una sesión
    name: 'SessioLobby',
    component: () => import('@/pages/SessioLobby.vue'),
    props: true // Esto pasa 'exerciseId' como prop al componente
  }, // <-- FALTAVA AQUESTA COMA
  
  // --- RUTA DE SALA D'ESPERA AFEGIDA ---
  {
    name: 'SalaEspera',
    path: '/exercici/:id/espera', // :id és l'exerciseId
    // He canviat la ruta per coincidir amb la teva estructura de '@/pages/'
    component: () => import('@/pages/SalaEspera.vue'), 
    props: true 
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router