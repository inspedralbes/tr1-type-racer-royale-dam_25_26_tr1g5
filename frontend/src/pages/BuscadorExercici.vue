<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const search = ref('')
const loginDialog = ref(false)
const tempName = ref('')
const userName = ref('')

interface Exercise {
  id: string
  name: string
  gif: string
}

const exercises = ref<Exercise[]>([
  { id: 'press-banca', name: 'Press de banca', gif: '/videos/pressbanca.gif' },
  { id: 'sentadilla', name: 'Sentadilla amb barra', gif: '/videos/sentadillaconbarra.gif' },
  { id: 'pes-mort', name: 'Pes mort', gif: '/videos/pesomuerto.gif' },
  { id: 'press-militar', name: 'Press militar', gif: '/videos/pressmilitar.gif' },
  { id: 'remo-barra', name: 'Remo amb barra', gif: '/videos/remoconbarra.gif' },
  { id: 'curl-biceps', name: 'Curl de bíceps amb barra', gif: '/videos/curlbicepsconbarra.gif' },
  { id: 'extensio-triceps', name: 'Extensió de tríceps en polea', gif: '/videos/extensiontricepsenpolea.gif' },
  { id: 'elevacions-laterals', name: 'Elevacions laterals', gif: '/videos/elevacioneslaterales.gif' }
])

const normalize = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const filteredExercises = computed(() => {
  if (!search.value) return exercises.value
  const term = normalize(search.value)
  return exercises.value.filter(ex => normalize(ex.name).includes(term))
})

const goToExercise = (exercise: Exercise) => {
  router.push({
    name: 'Exercici',
    params: { id: exercise.id },
    query: { name: exercise.name }
  })
}

const login = () => {
  if (tempName.value.trim()) {
    userName.value = tempName.value.trim()
    tempName.value = ''
    loginDialog.value = false
  }
}
</script>

<template>
  <v-app>
    <v-app-bar app color="#FF6600" flat>
  
  <v-img
    src="/fitcamicon.png"
    alt="FitCam"
    contain
    max-height="128"
    max-width="128"
    class="me-2"
  ></v-img>

  <v-toolbar-title class="text-white text-h5 font-weight-bold">
    Buscador d'exercicis
  </v-toolbar-title>

  <v-spacer></v-spacer>

  <v-btn color="white" text class="text-none" @click="loginDialog = true">
    {{ userName ? `Hola, ${userName}` : 'Log In / Registrar-se' }}
  </v-btn>

</v-app-bar>

    <v-main>
      <v-container class="py-8" fluid>
        <v-row justify="center" class="mb-8">
          <v-col cols="12" sm="10" md="8" lg="6">
            <v-text-field
              v-model="search"
              label="Buscar exercici..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              clearable
              hide-details
              density="comfortable"
              bg-color="surface"
            />
          </v-col>
        </v-row>

        <v-row justify="center">
          <v-col
            v-for="exercise in filteredExercises"
            :key="exercise.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="exercise-card"
              elevation="2"
              height="200"
              @click="goToExercise(exercise)"
              hover
            >
              <div class="card-background" />
              <v-img
                v-if="exercise.gif"
                :src="exercise.gif"
                class="gif-overlay"
                cover
              />
              <div class="card-content">
                <h3 class="exercise-title">{{ exercise.name }}</h3>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>



    <v-footer color="#FF6600" class="text-center d-flex align-center justify-center" height="60" style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 10;"
    >
      <v-img
        src="/fitcamicon.png"
        alt="FitCam"
        contain
        max-height="96"
        max-width="96"
      />
    </v-footer>

    <v-dialog v-model="loginDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 pa-4">
          Iniciar sessió / Registrar-se
        </v-card-title>
        <v-card-text class="pb-2">
          <v-text-field
            v-model="tempName"
            label="Nom d'usuari"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="loginDialog = false">
            Cancel·lar
          </v-btn>
          <v-btn color="#FF6600" variant="flat" @click="login">
            Acceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
.exercise-card {
  border-radius: 16px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.exercise-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25) !important;
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}

.gif-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
  z-index: 1;
}

.exercise-card:hover .gif-overlay {
  opacity: 1;
}

.card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  z-index: 2;
}

.exercise-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin: 0;
  line-height: 1.3;
}

:deep(.v-toolbar-title) {
  color: white !important;
}

:deep(.v-btn) {
  color: white !important;
}
</style>