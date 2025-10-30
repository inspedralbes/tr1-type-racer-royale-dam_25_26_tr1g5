<template>
  <v-app>
    <!-- Navbar gris oscuro con icono -->
    <v-app-bar app color="#FF6600" flat>
      <v-img
        src="/fitcamicon.png"
        alt="FitCam"
        contain
        max-height="128"
        max-width="128"
        class="me-2"
      ></v-img>
      <v-toolbar-title class="text-white">Buscador d'exercicis</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="white" text @click="loginDialog = true">
        {{ userName ? `Hola, ${userName}` : 'Log In / Registrar-se' }}
      </v-btn>
    </v-app-bar>

    <!-- Contenido principal -->
    <v-main class="flex-grow-1" style="padding-bottom: 60px;">
      <v-container class="pa-8" fluid>
        <!-- Buscador centrado -->
        <v-row justify="center" class="mb-8">
          <v-col cols="12" sm="8" md="6">
            <v-text-field
              v-model="search"
              label="Buscar exercici..."
              prepend-inner-icon="mdi-magnify"
              outlined
              clearable
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Cuadrados de ejercicios -->
        <v-row justify="center" align="stretch" dense>
          <v-col
            v-for="exercise in filteredExercises"
            :key="exercise"
            cols="12"
            sm="6"
            md="2"
            lg="3"
          >
          <v-card
          class="exercise-card"
          elevation="1"
          height="150"
          @click="goToExercise(exercise)"
          style="cursor: pointer;"
          >
              <!-- GIF ocupa todo el recuadro al hover -->
              <v-img
                v-if="exerciseGifs[exercise]"
                :src="exerciseGifs[exercise]"
                class="gif-overlay"
              ></v-img>

              <!-- Nombre del ejercicio encima del GIF -->
              <span class="text-h6 font-weight-medium card-text">{{ exercise }}</span>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dialogo de login simple -->
        <v-dialog v-model="loginDialog" max-width="400">
          <v-card>
            <v-card-title class="text-h6">Iniciar sesión / Registrar-se</v-card-title>
            <v-card-text>
              <v-text-field v-model="tempName" label="Nombre de usuario" />
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="loginDialog = false">Cancelar</v-btn>
              <v-btn color="primary" @click="login()">Aceptar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>

    <!-- Footer fijo con icono -->
    <v-footer
      color="#FF6600"
      class="text-center d-flex align-center justify-center"
      height="60"
      style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 10;"
    >
      <v-img
        src="/fitcamicon.png"
        alt="FitCam"
        contain
        max-height="96"
        max-width="96"
        class="me-2"
      ></v-img>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const goToExercise = (exercise) => {
  router.push({
    name: 'Exercici', // nombre de la ruta de tu Exercici.vue
    query: { name: exercise } // opcional: pasar el nombre del ejercicio
  })
}

const search = ref('')
const loginDialog = ref(false)
const tempName = ref('')
const userName = ref('')

const exercises = ref([
  'Press de banca',
  'Sentadilla amb barra',
  'Pes mort',
  'Press militar',
  'Remo amb barra',
  'Curl de bíceps amb barra',
  'Extensió de tríceps en polea',
  'Elevacions laterals',
    /*
  'Jalón al pit',
  'Press de cames',
  'Extensió de cames',
  'Curl femoral tumbat',
  'Abdominales en màquina',
  'Press inclinat amb manuelles',
  'Remo en màquina',
  'Face pull',
  'Aduccions de cadera',
  'Elevacions de talons',
  'Fons en paral·leles',
  'Dominadas assistides' */
])

// Diccionario de GIFs por ejercicio
const exerciseGifs = {
  'Press de banca': '/videos/pressbanca.gif',
  'Sentadilla amb barra': '/videos/sentadillaconbarra.gif',
  'Pes mort': '/videos/pesomuerto.gif',
  'Press militar': '/videos/pressmilitar.gif',
  'Remo amb barra': '/videos/remoconbarra.gif',
  'Curl de bíceps amb barra': '/videos/curlbicepsconbarra.gif',
  'Extensió de tríceps en polea': '/videos/extensiontricepsenpolea.gif',
  'Elevacions laterals': '/videos/elevacioneslaterales.gif',
  /*
  'Jalón al pit': '/videos/jalonpecho.gif',
  'Press de cames': '/videos/presspiernas.gif',
  'Extensió de cames': '/videos/extensionpiernas.gif',
  'Curl femoral tumbat': '/videos/curlfemoralacostado.gif',
  'Abdominales en màquina': '/videos/abdominalesenmaquina.gif',
  'Press inclinat amb manuelles': '/videos/pressinclinadoenmancuernas.gif',
  'Remo en màquina': '/videos/remoenmaquina.gif',
  'Face pull': '/videos/facepull.gif',
  'Aduccions de cadera': '/videos/aductorescadera.gif',
  'Elevacions de talons': '/videos/elevacionesdetalon.gif',
  'Fons en paral·leles': '/videos/fondosenparalelas.gif',
  'Dominadas assistides': '/videos/dominadasasistidas.gif'
    */
}

const normalize = str =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const filteredExercises = computed(() => {
  if (!search.value) return exercises.value
  const term = normalize(search.value)
  return exercises.value.filter(ex => normalize(ex).includes(term))
})

const login = () => {
  if (tempName.value.trim()) {
    userName.value = tempName.value.trim()
    tempName.value = ''
    loginDialog.value = false
  }
}
</script>

<style scoped>
.exercise-card {
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exercise-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

/* GIF overlay estirado para ocupar todo el card */
.gif-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;  
  opacity: 0;
  transition: opacity 0.5s;
  z-index: 1;
}

.exercise-card:hover .gif-overlay {
  opacity: 1;
}

/* Texto sobre GIF */
.card-text {
  position: relative;
  z-index: 2;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
}
</style>

