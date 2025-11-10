<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Socket } from 'socket.io-client'

// --- Tipos de Datos (ACTUALITZATS) ---
interface Player {
  id: string
  nickname: string
  reps: number
  cals: number
  time: number
  isReady: boolean // <-- AFEGIT
}
interface Room {
  id: string
  exerciseId: string
  exerciseName: string
  hostId: string
  players: Player[]
}
// ------------------------------------

const props = defineProps<{
  exerciseId: string
}>()

const route = useRoute()
const router = useRouter()

const socket = inject('socket') as Socket

const exerciseName = ref((route.query.name as string) || 'Sessió')
const userName = ref(localStorage.getItem('userName') || `Visitant_${Math.floor(Math.random() * 100)}`)

const activeSessions = ref<Room[]>([])
const joinCode = ref('')
const loading = ref(false)
const isPrivate = ref(false)

onMounted(() => {
  if (!localStorage.getItem('userName')) {
    localStorage.setItem('userName', userName.value)
  }

  if (!socket.connected) {
    socket.connect()
  }

  socket.emit('session:requestList', props.exerciseId)

  socket.on('session:list', (sessions: Room[]) => {
    activeSessions.value = sessions
  })

  // --- MODIFICAT: Ara naveguem a 'SalaEspera' ---
  socket.on('session:joined', (room: Room) => {
    loading.value = false
    
    // Netejar el listener abans de marxar
    socket.off('session:list')
    socket.off('session:joined')
    socket.off('session:error')
    
    // Naveguem a la SALA D'ESPERA
    router.push({
      name: 'SalaEspera', // <-- CANVIAT
      params: { id: props.exerciseId }, // 'id' és l'exerciseId
      query: { 
        name: exerciseName.value,
        sessionId: room.id, // <-- L'ID de la sala
        video: route.query.video // <-- Passem el vídeo
      }
    })
  })
  // ---------------------------------------------

  socket.on('session:error', (message: string) => {
    loading.value = false
    alert(`Error: ${message}`)
  })
})

onUnmounted(() => {
  // Netejar els listeners si l'usuari marxa d'aquesta vista
  socket.off('session:list')
  socket.off('session:joined')
  socket.off('session:error')
})

// 1. Iniciar en modo individual (Sense canvis)
const startSolo = () => {
  router.push({
    name: 'Exercici',
    params: { id: props.exerciseId },
    query: { 
      name: exerciseName.value,
      video: route.query.video
    }
  })
}

// 2. Crear una nova sala de grup (Sense canvis de lògica)
const createGroupSession = () => {
  loading.value = true
  socket.emit('session:create', {
    exerciseId: props.exerciseId,
    exerciseName: exerciseName.value,
    hostName: userName.value,
    isPrivate: isPrivate.value
  })
}

// 3. Unirse a una sala con un código (Sense canvis de lògica)
const joinByCode = () => {
  if (joinCode.value.trim().length === 6) {
    loading.value = true
    socket.emit('session:join', {
      roomId: joinCode.value.trim(),
      nickname: userName.value
    })
  } else {
    alert('El codi ha de tenir 6 dígits.')
  }
}

// 4. Unirse a una sala pública desde la lista (Sense canvis de lògica)
const joinPublicSession = (roomId: string) => {
    loading.value = true
    socket.emit('session:join', {
      roomId: roomId,
      nickname: userName.value
    })
}


const goBack = () => {
  router.push({ name: 'BuscadorExercici' })
}

const canInteract = computed(() => !loading.value)

</script>

<template>
  <v-app>
    <v-overlay :model-value="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>

    <v-app-bar color="#FF6600" elevation="0">
      <v-container class="d-flex align-center pa-0">
        <v-btn icon @click="goBack" class="me-2" :disabled="!canInteract">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title class="text-h5 font-weight-bold">
          {{ exerciseName }}
        </v-toolbar-title>
      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-5">
      <v-container class="py-8">
        <v-row justify="center">
          
          <v-col cols="12" md="6">
            <v-card class="pa-6 mb-6" elevation="3">
              <h2 class="text-h5 font-weight-bold mb-6">Modes de Sessió</h2>
              
              <v-btn
                color="primary"
                block
                size="x-large"
                class="mb-4"
                @click="startSolo"
                :disabled="!canInteract"
              >
                <v-icon left>mdi-account</v-icon>
                Entrenar en solitari
              </v-btn>
              
              <v-divider class="my-4"></v-divider>
              
              <v-switch
                v-model="isPrivate"
                label="Fer la sala privada (només amb codi)"
                color="info"
                :disabled="!canInteract"
                class="mb-2"
              ></v-switch>
              
              <v-btn
                color="success"
                block
                size="x-large"
                @click="createGroupSession"
                :disabled="!canInteract"
              >
                <v-icon left>mdi-account-group</v-icon>
                Entrenar en grup
              </v-btn>
              </v-card>

            <v-card class="pa-6" elevation="3">
              <h3 class="text-h6 font-weight-bold mb-4">Unir-se amb Codi</h3>
              <v-text-field
                v-model="joinCode"
                label="Codi de 6 dígits"
                variant="outlined"
                maxlength="6"
                counter
                :disabled="!canInteract"
                @keyup.enter="joinByCode"
              />
              <v-btn
                color="info"
                block
                size="large"
                :disabled="joinCode.length !== 6 || !canInteract"
                @click="joinByCode"
              >
                Unir-se a la Sessió
              </v-btn>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="pa-6" elevation="3" min-height="100%">
              <h2 class="text-h5 font-weight-bold mb-6">Entrenaments Públics Actius</h2>
              
              <v-list v-if="activeSessions.length > 0" lines="two">
                <v-list-item
                  v-for="session in activeSessions"
                  :key="session.id"
                  @click="joinPublicSession(session.id)"
                  class="session-item"
                  :disabled="!canInteract"
                >
                  <v-list-item-title class="font-weight-bold">
                    Sessió de {{ session.players[0].nickname }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Codi: {{ session.id }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip color="orange" size="small">
                      <v-icon left small>mdi-account-multiple</v-icon>
                      {{ session.players.length }} / 4
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center text-grey pa-4 d-flex flex-column justify-center align-center" style="height: 100%;">
                <v-icon size="64" class="mb-4">mdi-sleep</v-icon>
                <p class="text-h6">No hi ha entrenaments de grup.</p>
                <p>Sigues el primer en crear-ne una!</p>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
:deep(.v-btn) {
  color: white !important;
}
:deep(.v-app-bar .v-btn .v-icon) {
  color: white !important;
}
.session-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.session-item:hover {
  background-color: #f5f5f5;
}
</style>