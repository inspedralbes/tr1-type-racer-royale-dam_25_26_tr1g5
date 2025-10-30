import { createRouter, createWebHistory } from 'vue-router'
import BuscadorExercici from '../pages/BuscadorExercici.vue'
import Exercici from '../pages/Exercici.vue'

const routes = [
  { path: '/', name: 'BuscadorExercici', component: BuscadorExercici },
  { path: '/exercici', name: 'Exercici', component: Exercici },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
