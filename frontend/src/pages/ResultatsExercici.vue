<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()

// --- Llegim les dades com a 'ref' per accedir-hi fàcilment ---
const tecnica = ref(Number(route.query.tecnica) || 0)
const reps = ref(Number(route.query.reps) || 0)
const temps = ref(Number(route.query.temps) || 0)
const series = ref(Number(route.query.series) || 0)
const nomExercici = ref((route.query.nom as string) || 'Sessió')
const exerciseId = ref((route.query.id as string) || 'unknown') // Aquest és l'ID string (ex: 'sentadilla')
const sessionId = ref((route.query.sessionId as string) || null)


// --- Lògica de la Vista ---
const isGroupSession = computed(() => !!sessionId.value)
const isNewPR = ref(false)

const classificacio = ref([
  { nom: 'Joan', tecnica: 92, reps: 35 },
  { nom: 'Maria', tecnica: 88, reps: 32 },
  { nom: 'Pau', tecnica: 75, reps: 28 },
  { nom: 'Tu', tecnica: tecnica.value, reps: reps.value }, 
])

// --- NOU: Funció per guardar a la BD ---
async function guardarResultats() {
  // 1. Aconseguir el token de l'usuari
  const token = localStorage.getItem('fitcam_token');

  // No guardis si no hi ha usuari (visitant) o si no hi ha repeticions
  if (!token || reps.value === 0) {
    console.log("Sessió de visitant o sense dades (reps=0), no es guarda a la BD.");
    return;
  }

  try {
    // 2. Cridar al nou endpoint del server.js
    const response = await fetch('http://localhost:3001/api/resultats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <-- Enviem el token per identificar l'usuari
      },
      body: JSON.stringify({
        nomExercici: nomExercici.value, // P.ex: "Sentadilla amb barra"
        tecnica: tecnica.value,
        reps: reps.value,
        series: series.value,
        temps: temps.value,
        sessionId: sessionId.value
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'El servidor ha fallat al guardar');
    }

    const data = await response.json();
    console.log("Resultats guardats a la BD:", data.message);

  } catch (error) {
    console.error("Error al guardar els resultats:", error);
    // (Opcional) Mostrar un error a l'usuari amb un snackbar
  }
}


onMounted(() => {
  // 1. Comprovem el rècord de repeticions (això és local)
  const prKey = `pr_${exerciseId.value}_reps` // Fem servir l'ID string per a localStorage
  const oldPR = Number(localStorage.getItem(prKey) || 0)

  if (reps.value > oldPR) {
    localStorage.setItem(prKey, reps.value.toString())
    isNewPR.value = true
  }

  // 2. NOU: Intentem guardar els resultats a la BD
  guardarResultats();
})

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  // Ometem les hores si és 00
  if (hours > 0) {
    return [hours, minutes, secs].map(u => u.toString().padStart(2, '0')).join(':')
  }
  return [minutes, secs].map(u => u.toString().padStart(2, '0')).join(':')
}

const feedbackTecnica = computed(() => {
  if (tecnica.value >= 95) return "Execució perfecta. Has clavat la forma!"
  if (tecnica.value >= 80) return "Molt bona feina! La teva forma és sòlida i consistent."
  if (tecnica.value >= 60) return "Bon esforç. Revisa el vídeo i centra't en mantenir la postura en les properes sèries."
  return "Continua practicant. Mira atentament el vídeo de demostració per corregir la forma."
})

const posicioUsuari = computed(() => {
  const sorted = [...classificacio.value].sort((a, b) => {
    if (b.tecnica !== a.tecnica) return b.tecnica - a.tecnica
    return b.reps - a.reps
  })
  return sorted.findIndex(e => e.nom === 'Tu') + 1
})

const tornarInici = () => router.push({ name: 'Home' })
const tornarCercador = () => router.push({ name: 'BuscadorExercici' })
</script>

<template>
  <v-app>
    <v-app-bar color="#FF6600" elevation="0">
      <a href="http://localhost:3000">
        <div style="height: 128px; width: 128px;">
          <v-img src="/fitcamicon.png" alt="FitCam" contain height="128" width="128" />
        </div>
      </a>
      <v-container class="d-flex align-center pa-0">
        <v-toolbar-title class="text-h5 font-weight-bold text-white">
          Resultats: {{ nomExercici }}
        </v-toolbar-title>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-6" fluid>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <v-card class="pa-6 text-center" elevation="3">
              <v-icon size="64" color="#FF6600" class="mb-4">
                mdi-trophy-award
              </v-icon>
              <h2 class="text-h4 font-weight-bold mb-2">
                Has completat la sessió!
              </h2>
              <p class="text-h6 text-grey-darken-1 font-weight-light mb-6">
                Bona feina 💪 Aquí tens els teus resultats:
              </p>

              <v-alert v-if="isNewPR" type="success" variant="tonal" class="mb-6" icon="mdi-star-circle-outline" prominent>
                <h3 class="text-h6">¡Nou Rècord Personal!</h3>
                Has superat la teva marca anterior de repeticions per a aquest exercici.
              </v-alert>

              <v-row justify="center" class="mb-4">
                <v-col cols="12">
                  <div class="text-subtitle-1 mb-3">Precisió Tècnica Mitjana</div>
                  <v-progress-circular :model-value="tecnica" :size="180" :width="16" color="#FF6600" class="mx-auto">
                    <template v-slot:default>
                      <span class="text-h3 font-weight-bold" style="color:#FF6600">
                        {{ tecnica.toFixed(1) }}<span class="text-h5">%</span>
                      </span>
                    </template>
                  </v-progress-circular>
                  <p class="text-body-1 mt-4 mb-6 mx-auto" style="max-width: 500px;">
                    {{ feedbackTecnica }}
                  </p>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <v-row class="mb-4 text-center">
                <v-col cols="12" sm="4">
                  <v-icon size="40" color="blue-darken-1" class="mb-2">mdi-timer-outline</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ formatTime(temps) }}
                  </div>
                  <div class="text-subtitle-1 text-grey-darken-2">Temps Actiu</div>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-icon size="40" color="green-darken-1" class="mb-2">mdi-clipboard-list-outline</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ series }}
                  </div>
                  <div class="text-subtitle-1 text-grey-darken-2">Sèries Completades</div>
                </v-col>

                <v-col cols="12" sm="4">
                  <v-icon size="40" color="purple-darken-1" class="mb-2">mdi-counter</v-icon>
                  <div class="text-h4 font-weight-bold">
                    {{ reps }}
                  </div>
                  <div class="text-subtitle-1 text-grey-darken-2">Repeticions Totals</div>
                </v-col>
              </v-row>

              <template v-if="isGroupSession">
                <v-divider class="my-4"></v-divider>
                <h3 class="text-h6 font-weight-bold mb-3">Rànquing de la Sessió</h3>
                <p class="text-body-1 mb-4">
                  La teva posició:
                  <strong class="text-h6" style="color:#FF6600">#{{ posicioUsuari }}</strong>
                </p>

                <v-table>
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Nom</th>
                      <th>Tècnica (%)</th>
                      <th>Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in classificacio" :key="index"
                      :class="{ 'bg-orange-lighten-5 font-weight-bold': row.nom === 'Tu' }">
                      <td>#{{ index + 1 }}</td>
                      <td>{{ row.nom }}</td>
                      <td>{{ row.tecnica.toFixed(0) }}</td>
                      <td>{{ row.reps }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </template>
              <v-row class="mt-8" justify="center" align="center">
                <v-col cols="12" sm="6" md="5">
                  <v-btn color="#FF6600" block size="large" variant="flat" @click="tornarCercador">
                    <v-icon class="me-2">mdi-magnify</v-icon>
                    Cercar un altre exercici
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="5">
                  <v-btn color="grey-darken-1" block size="large" variant="outlined" @click="tornarInici">
                    <v-icon class="me-2">mdi-home</v-icon>
                    Tornar a l’inici
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-table {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #E0E0E0;
}

thead {
  background: #f5f5f5;
}

thead th {
  color: #FF6600 !important;
  font-weight: bold !important;
  text-transform: uppercase;
  font-size: 0.85rem;
}

td,
th {
  text-align: center !important;
  padding: 12px 16px !important;
}

.v-progress-circular > .v-progress-circular__content {
  color: #FF6600;
}
</style>  