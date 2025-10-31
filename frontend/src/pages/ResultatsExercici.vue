<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const route = useRoute()
const router = useRouter()

const tecnica = Number(route.query.tecnica) || 0
const reps = Number(route.query.reps) || 0

const classificacio = ref([
  { nom: 'Joan', tecnica: 92, reps: 35 },
  { nom: 'Maria', tecnica: 88, reps: 32 },
  { nom: 'Pau', tecnica: 75, reps: 28 },
  { nom: 'Tu', tecnica: tecnica, reps: reps },
])

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
      <v-container class="d-flex align-center pa-0">
        <v-toolbar-title class="text-h5 font-weight-bold text-white">
          Resultats de la Sessió
        </v-toolbar-title>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-6" fluid>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-6 text-center" elevation="3">
              <v-icon size="64" color="#FF6600" class="mb-4">
                mdi-trophy
              </v-icon>
              <h2 class="text-h4 font-weight-bold mb-2">
                Has completat la sessió!
              </h2>
              <p class="text-body-1 mb-6">
                Bona feina 💪 Aquí tens els teus resultats:
              </p>

              <v-row class="mb-4">
                <v-col cols="6">
                  <div class="text-h5 font-weight-bold" style="color:#FF6600">
                    {{ tecnica.toFixed(1) }}%
                  </div>
                  <div class="text-subtitle-1">Precisió tècnica</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h5 font-weight-bold" style="color:#FF6600">
                    {{ reps }}
                  </div>
                  <div class="text-subtitle-1">Repeticions totals</div>
                </v-col>
              </v-row>

              <p class="text-body-1 mb-4">
                La teva posició al rànquing: 
                <strong>#{{ posicioUsuari }}</strong>
              </p>

              <v-table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Tècnica (%)</th>
                    <th>Reps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in classificacio"
                    :key="index"
                    :class="{ 'bg-orange-lighten-5': row.nom === 'Tu' }"
                  >
                    <td>{{ row.nom }}</td>
                    <td>{{ row.tecnica }}</td>
                    <td>{{ row.reps }}</td>
                  </tr>
                </tbody>
              </v-table>

              <v-row class="mt-6" justify="center" align="center">
                <v-col cols="12" sm="6">
                  <v-btn color="#FF6600" block variant="flat" @click="tornarInici">
                    <v-icon class="me-2">mdi-home</v-icon>
                    Tornar a l’inici
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-btn color="grey-darken-1" block variant="outlined" @click="tornarCercador">
                    <v-icon class="me-2">mdi-magnify</v-icon>
                    Cercar un altre exercici
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
}
thead {
  background: #ff6600;
  color: white;
}
td, th {
  text-align: center;
  padding: 8px 12px;
}
</style>
