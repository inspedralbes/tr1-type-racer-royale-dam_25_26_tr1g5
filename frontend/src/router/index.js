import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path:'/', name:'Home', component: () => import('../pages/index.vue') },
  { path:'/login', name:'Login', component: () => import('../pages/login.vue') },
  { path:'/register', name:'Register', component: () => import('../pages/register.vue') },
  { path:'/exercicis', name:'BuscadorExercici', component: () => import('../pages/buscadorexercici.vue') },
  { path:'/exercici/:id', name:'Exercici', component: () => import('../pages/exercici.vue') }
]


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),  
  routes,
})

export default router
