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

const route = useRoute()
const router = useRouter()
const socket = inject('socket') as Socket

// Dades de la ruta
const exerciseId = computed(() => route.params.id as string)
const exerciseName = computed(() => (route.query.name as string) || 'Sessió')
const sessionId = computed(() => (route.query.sessionId as string) || 'ERROR')
const videoUrl = computed(() => route.query.video as string)

// Dades de la sala
const roomState = ref<Room | null>(null)
const myId = computed(() => socket.id)
const myNickname = ref(localStorage.getItem('userName') || 'Tu')

// Estats calculats
const isHost = computed(() => roomState.value?.hostId === myId.value)
const allReady = computed(() => roomState.value?.players.every(p => p.isReady))
const myPlayer = computed(() => roomState.value?.players.find(p => p.id === myId.value))

// --- Lògica de Sockets ---
onMounted(() => {
  if (!socket.connected) {
    socket.connect()
  }

  // 1. Escuchar actualitzacions
  socket.on('session:roomUpdate', (room: Room) => {
    roomState.value = room
  })

  // 2. Escuchar errors
  socket.on('session:error', (message: string) => {
    alert(`Error: ${message}`)
  })

  // 3. Escuchar l'inici
  socket.on('session:start', (room: Room) => {
    // Netejar listeners abans de marxar
    cleanupSocketListeners()

    // Anem a l'exercici!
    router.push({
      name: 'Exercici',
      params: { id: exerciseId.value },
      query: {
        name: exerciseName.value,
        sessionId: room.id,
        video: videoUrl.value
      }
    })
  })

  // 4. Demanar l'estat actual (per si refresquem la pàgina)
  socket.emit('session:getState', sessionId.value)
})

const cleanupSocketListeners = () => {
  socket.off('session:roomUpdate')
  socket.off('session:error')
  socket.off('session:start')
}

onUnmounted(() => {
  cleanupSocketListeners()
  // No marxem de la sala al sortir, el 'disconnect' ho gestionarà
})

// --- Accions de l'Usuari ---

const toggleReady = () => {
  if (!myPlayer.value) return
  socket.emit('session:setReady', {
    roomId: sessionId.value,
    isReady: !myPlayer.value.isReady
  })
}

const startSession = () => {
  if (!isHost.value) return
  socket.emit('session:requestStart', {
    roomId: sessionId.value
  })
}

const leaveLobby = () => {
  // En desconnectar, el server ens treurà de la sala
  socket.disconnect()
  router.push({
    name: 'SessioLobby',
    params: { exerciseId: exerciseId.value },
    query: {
      name: exerciseName.value,
      video: videoUrl.value
    }
  })
}
</script>

<template>
  <v-app>
    <v-app-bar color="#FF6600" elevation="0">
      <v-container class="d-flex align-center pa-0">
        <v-btn icon @click="leaveLobby" class="me-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title class="text-h5 font-weight-bold">
          Sala d'espera: {{ exerciseName }}
        </v-toolbar-title>
        <v-spacer />
        <v-chip color="white" text-color="orange" variant="flat">
          <v-icon left>mdi-ticket</v-icon>
          Codi: {{ sessionId }}
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-5">
      <v-container class="py-8">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-6" elevation="3">
              <h2 class="text-h5 font-weight-bold mb-6">Jugadors a la sala</h2>

              <v-list v-if="roomState" lines="two" class="mb-6">
                <v-list-item
                  v-for="player in roomState.players"
                  :key="player.id"
                  class="player-item"
                  :class="{ 'player-you': player.id === myId }"
                >
                  <template v-slot:prepend>
                    <v-icon
                      :color="roomState.hostId === player.id ? 'amber' : 'grey'"
                      size="large"
                    >
                      {{ roomState.hostId === player.id ? 'mdi-crown' : 'mdi-account-circle' }}
                    </v-icon>
                  </template>

                  <v-list-item-title class="font-weight-bold text-h6 ms-3">
                    {{ player.nickname }}
                    <span v-if="player.id === myId">(Tu)</span>
                  </v-list-item-title>

                  <template v-slot:append>
                    <v-chip
                      :color="player.isReady ? 'success' : 'grey'"
                      variant="flat"
                      text-color="white"
                    >
                      <v-icon start>
                        {{ player.isReady ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                      </v-icon>
                      {{ player.isReady ? 'A punt' : 'Esperant...' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>

              <v-row>
                <v-col cols="12" md="6">
                  <v-btn
                    v-if="myPlayer"
                    :color="myPlayer.isReady ? 'blue-grey' : 'success'"
                    block
                    size="x-large"
                    @click="toggleReady"
                  >
                    <v-icon left>
                      {{ myPlayer.isReady ? 'mdi-close' : 'mdi-check' }}
                    </v-icon>
                    {{ myPlayer.isReady ? 'Cancel·lar' : 'Estic a punt' }}
                  </v-btn>
                </v-col>
                <v-col cols="12" md="6">
                  <v-btn
                    v-if="isHost"
                    color="primary"
                    block
                    size="x-large"
                    :disabled="!allReady"
                    @click="startSession"
                  >
                    <v-icon left>mdi-rocket-launch</v-icon>
                    Començar Sessió
                  </v-btn>
                  <v-alert
                    v-if="isHost && !allReady"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                  >
                    Cal que tots estiguin "A punt" per començar.
                  </v-alert>
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
:deep(.v-btn) {
  color: white !important;
}
:deep(.v-app-bar .v-btn .v-icon) {
  color: white !important;
}
.player-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
}
.player-you {
  background-color: #FFF9C4; /* Un groc pàl·lid per destacar-te */
}
</style>