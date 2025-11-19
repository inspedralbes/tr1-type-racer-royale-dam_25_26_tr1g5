<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const search = ref('')
const loginDialog = ref(false)
const tempName = ref('')
const userName = ref('')

const exerciseDialog = ref(false)
const selectedExercise = ref<Exercise | null>(null)

interface Exercise {
  id: string
  name: string
  gif: string
  description: string
  muscles: string
  equipment: string
}

const exercises = ref<Exercise[]>([
  {
    id: 'press-banca',
    name: 'Press de banca',
    gif: '/videos/pressbanca.gif',
    description: 'Exercici fonamental per al desenvolupament del pit, treballant també espatlles i tríceps.',
    muscles: 'Pectoral major, Deltoides anterior, Tríceps',
    equipment: 'Barra i banc pla'
  },
  {
    id: 'sentadilla',
    name: 'Sentadilla amb barra',
    gif: '/videos/sentadillaconbarra.gif',
    description: 'El rei dels exercicis de cames, treballa tots els músculs del tren inferior.',
    muscles: 'Quadríceps, Glútis, Isquiotibials',
    equipment: 'Barra i rack de sentadilles'
  },
  {
    id: 'pes-mort',
    name: 'Pes mort',
    gif: '/videos/pesomuerto.gif',
    description: 'Exercici complet que treballa múltiples grups musculars, especialment la cadena posterior.',
    muscles: 'Isquiotibials, Glútis, Erectores de columna',
    equipment: 'Barra'
  },
  {
    id: 'press-militar',
    name: 'Press militar',
    gif: '/videos/pressmilitar.gif',
    description: 'Exercici per al desenvolupament de les espatlles, principalment el deltoides.',
    muscles: 'Deltoides, Tríceps, Core',
    equipment: 'Barra'
  },
  {
    id: 'remo-barra',
    name: 'Remo amb barra',
    gif: '/videos/remoconbarra.gif',
    description: 'Exercici essencial per al desenvolupament de l\'esquena i la postura.',
    muscles: 'Dorsal ample, Trapezi, Romboides',
    equipment: 'Barra'
  },
  {
    id: 'curl-biceps',
    name: 'Curl de bíceps amb barra',
    gif: '/videos/curlbicepsconbarra.gif',
    description: 'Exercici d\'aïllament per al desenvolupament dels bíceps.',
    muscles: 'Bíceps braquial, Braquial anterior',
    equipment: 'Barra'
  },
  {
    id: 'extensio-triceps',
    name: 'Extensió de tríceps en polea',
    gif: '/videos/extensiontricepsenpolea.gif',
    description: 'Exercici d\'aïllament per als tríceps utilitzant polea.',
    muscles: 'Tríceps braquial',
    equipment: 'Polea alta i corda o barra'
  },
  {
    id: 'elevacions-laterals',
    name: 'Elevacions laterals',
    gif: '/videos/elevacioneslaterales.gif',
    description: 'Exercici d\'aïllament per al deltoides lateral, donant amplada a les espatlles.',
    muscles: 'Deltoides lateral',
    equipment: 'Manuelles'
  }
])

onMounted(() => {
  const storedName = localStorage.getItem('userName')
  if (storedName) {
    userName.value = storedName
  }
})

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

const openExerciseDialog = (exercise: Exercise) => {
  selectedExercise.value = exercise
  exerciseDialog.value = true
}

// --- MODIFICAT ---
// Aquesta funció ara inclou el 'video' (GIF) en la query,
// combinant la lògica dels dos fitxers.
const confirmGoToLobby = () => {
  if (selectedExercise.value) {
    router.push({
      name: 'SessioLobby',
      params: { exerciseId: selectedExercise.value.id },
      query: {
        name: selectedExercise.value.name,
        video: selectedExercise.value.gif // <-- Aquesta línia és la millora del segon fitxer
      }
    })
  }
  exerciseDialog.value = false
  selectedExercise.value = null
}

const login = () => {
  if (tempName.value.trim()) {
    const name = tempName.value.trim()
    userName.value = name
    localStorage.setItem('userName', name)
    tempName.value = ''
    loginDialog.value = false
  }
}
</script>

<template>
  <v-app>
   <NavBar/>
    <v-main>
      <v-container class="py-8" fluid>
        <v-row justify="center" class="mb-8">
          <v-col cols="12" sm="10" md="8" lg="6">
            <v-text-field v-model="search" label="Buscar exercici..." prepend-inner-icon="mdi-magnify"
              variant="outlined" clearable hide-details density="comfortable" bg-color="surface" />
          </v-col>
        </v-row>

        <v-row justify="center">
          <v-col v-for="exercise in filteredExercises" :key="exercise.id" cols="12" sm="6" md="4" lg="3">
            <v-card class="exercise-card" elevation="2" height="200" @click="openExerciseDialog(exercise)" hover>
              <div class="card-background" />
              <v-img v-if="exercise.gif" :src="exercise.gif" class="gif-overlay" cover />
              <div class="card-content">
                <h3 class="exercise-title">{{ exercise.name }}</h3>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer color="#FF6600" class="text-center d-flex align-center justify-center" height="60"
      style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 10;">
      <a href="http://localhost:3000">
        <div style="height: 128px; width: 128px;">
          <v-img src="/fitcamicon.png" alt="FitCam" contain height="128" width="128" />
        </div>
      </a>
    </v-footer>

    <!-- Login -->

    <v-dialog v-model="loginDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 pa-4">
          Iniciar sessió / Registrar-se
        </v-card-title>
        <v-card-text class="pb-2">
          <v-text-field v-model="tempName" label="Nom d'usuari" variant="outlined" density="comfortable" hide-details
            @keyup.enter="login" />
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

    <v-dialog v-model="exerciseDialog" max-width="800">
      <v-card v-if="selectedExercise">
        <v-card-title class="text-h5 pa-4 bg-primary">
          {{ selectedExercise.name }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-img :src="selectedExercise.gif" :alt="`GIF de ${selectedExercise.name}`" cover height="300"
                class="rounded-lg elevation-2" />
            </v-col>
            <v-col cols="12" md="6">
              <h3 class="text-h6 mb-3">Informació de l'exercici</h3>
              <p class="text-body-1 mb-4">
                {{ selectedExercise.description }}
              </p>
              <v-divider class="my-3"></v-divider>
              <div class="mb-3">
                <h4 class="text-subtitle-1 font-weight-bold mb-1">Músculs implicats:</h4>
                <p class="text-body-2">{{ selectedExercise.muscles }}</p>
              </div>
              <div>
                <h4 class="text-subtitle-1 font-weight-bold mb-1">Equipament:</h4>
                <p class="text-body-2">{{ selectedExercise.equipment }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="exerciseDialog = false">
            Tancar
          </v-btn>
          <v-btn color="#FF6600" variant="flat" @click="confirmGoToLobby">
            <v-icon start>mdi-account-group</v-icon>
            Comemçar exercici
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

.bg-primary {
  background-color: #FF6600;
  color: white;
}
</style>