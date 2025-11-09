import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { socket } from './socket' // <-- AÑADIDO

createApp(App)
  .use(router)
  .use(vuetify)
  .provide('socket', socket) // <-- AÑADIDO
  .mount('#app')
