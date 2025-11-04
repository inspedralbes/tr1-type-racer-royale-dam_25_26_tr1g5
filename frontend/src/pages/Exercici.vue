<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Socket } from 'socket.io-client'

// --- DEFINICIONES (sin cambios) ---
interface Player {
  id: string
  nickname: string
  reps: number
  cals: number
  time: number
}
interface Room {
  id: string
  exerciseId: string
  exerciseName: string
  hostId: string
  players: Player[]
}

const route = useRoute()
const router = useRouter()
const socket = inject('socket') as Socket

// Dades de la Ruta
const exerciseName = (route.query.name as string) || 'Exercici'
const sessionId = ref((route.query.sessionId as string) || null)
const isGroupSession = computed(() => !!sessionId.value)

// Dades de la Sala
const roomState = ref<Room | null>(null)
const myNickname = ref(localStorage.getItem('userName') || 'Tu')

// Dades de la Càmera i Vídeo
const videoUrl = ref('/videos/Download.mp4')
const videoStream = ref<MediaStream | null>(null)
const cameraElement = ref<HTMLVideoElement | null>(null)
const cameraError = ref(false)

// Estadístiques Locals
const exerciseCount = ref(0)
const sessionTime = ref(0)
const caloriesBurned = ref(0)
const isTimerRunning = ref(false)
let intervalId: number | null = null

// --- LÒGICA DE SOCKETS (MODIFICADA) ---

const setupSocketListeners = () => {
  // 1. Escuchamos actualizaciones de la sala
  socket.on('session:roomUpdate', (room: Room) => {
    roomState.value = room
  })

  // 2. Escuchamos errores
  socket.on('session:error', (message: string) => {
    // Usamos un div custom en vez de alert, pero para el ejemplo sirve
    alert(`Error de sessió: ${message}. Tornant al lobby...`)
    goBack()
  })
  
  // 3. ¡IMPORTANTE! Pedimos el estado actual de la sala
  // El servidor debería tener un listener para 'session:getState'
  // que responda con un 'session:roomUpdate' solo a este cliente.
  // Asumimos que el servidor ya tiene al cliente en la sala correcta
  // (esto debería haberse hecho en la vista de Lobby)
  socket.emit('session:getState', sessionId.value)
}

onMounted(async () => {
  // 1. Iniciar Càmera (sin cambios)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    videoStream.value = stream
    if (cameraElement.value) {
      cameraElement.value.srcObject = stream
    }
    cameraError.value = false
  } catch (error) {
    console.error('Error al accedir a la càmera:', error)
    cameraError.value = true
  }

  // 2. Lògica de Grup (MODIFICADA)
  if (isGroupSession.value) {
    if (socket.connected) {
      // Si ya estamos conectados, configuramos listeners
      console.log('Socket ya conectado. Configurando listeners.')
      setupSocketListeners()
    } else {
      // Si no, esperamos al evento 'connect'
      console.log('Socket no conectado. Esperando conexión...')
      socket.on('connect', () => {
        console.log('Socket conectado! Configurando listeners.')
        setupSocketListeners()
      })
    }
  }
})

onUnmounted(() => {
  // 1. Aturar Càmera (sin cambios)
  videoStream.value?.getTracks().forEach(track => track.stop())
  if (intervalId !== null) clearInterval(intervalId)

  // 2. Netejar Sockets (sin cambios)
  if (isGroupSession.value) {
    socket.off('session:roomUpdate')
    socket.off('session:error')
    socket.off('connect') // Limpiamos el listener de 'connect' por si acaso
  }
})

// --- FUNCIONS (sin cambios) ---

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map(u => u.toString().padStart(2, '0')).join(':')
}

const broadcastStats = () => {
  if (isGroupSession.value && sessionId.value && socket.connected) { // Añadido check de socket.connected
    socket.emit('exercise:updateStats', {
      roomId: sessionId.value,
      reps: exerciseCount.value,
      cals: caloriesBurned.value,
      time: sessionTime.value
    })
  }
}

const incrementExercises = () => {
  exerciseCount.value++
  caloriesBurned.value += Math.floor(Math.random() * 3) + 2
  broadcastStats()
}

const startTimer = () => {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  intervalId = window.setInterval(() => {
    sessionTime.value++
    if (sessionTime.value % 10 === 0) {
      caloriesBurned.value += Math.floor(Math.random() * 5) + 1
    }
    broadcastStats()
  }, 1000)
}

const pauseTimer = () => {
  if (!isTimerRunning.value) return
  isTimerRunning.value = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  broadcastStats()
}

const resetStats = () => {
  pauseTimer()
  exerciseCount.value = 0
  sessionTime.value = 0
  caloriesBurned.value = 0
  broadcastStats()
}

const goBack = () => {
  if (isGroupSession.value) {
    router.push({ 
      name: 'SessioLobby', 
      params: { exerciseId: route.params.id },
      query: { name: exerciseName }
    })
  } else {
    router.push({ name: 'BuscadorExercici' })
  }
}

const finalitzarSessio = () => {
  pauseTimer()
  router.push({
    name: 'ResultatsExercici',
    query: {
      tecnica: (Math.random() * 100).toFixed(1),
      reps: exerciseCount.value
    }
  })
}

</script>

<template>
  <v-app>
    <v-app-bar color="#FF6600" elevation="0">
      <v-container class="d-flex align-center pa-0">
        <v-btn icon @click="goBack" class="me-2">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title class="text-h5 font-weight-bold">
          {{ exerciseName }}
        </v-toolbar-title>
        <v-spacer />
        <v-chip v-if="isGroupSession" color="white" text-color="orange" variant="flat">
          <v-icon left>mdi-account-group</v-icon>
          Grup (Codi: {{ sessionId }})
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-3" fluid>
        <v-row>
          <v-col cols="6" md="6">
            <v-card class="video-card" elevation="3">
              <v-card-title class="text-h6 bg-grey-darken-3 text-white">
                <v-icon class="me-2">mdi-play-circle</v-icon>
                Video de demostració
              </v-card-title>
              <v-card-text class="pa-0">
                <video :src="videoUrl" controls autoplay class="video-player" />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="6" md="6">
            <v-card class="camera-card" elevation="3">
              <v-card-title class="text-h6 bg-grey-darken-3 text-white">
                <v-icon class="me-2">mdi-camera</v-icon>
                La teva càmera
              </v-card-title>
              <v-card-text class="pa-0 camera-container">
                <video
                  v-if="!cameraError"
                  ref="cameraElement"
                  autoplay
                  playsinline
                  class="camera-player"
                />
                <div v-else class="camera-error">
                  <v-icon size="64" color="error">mdi-camera-off</v-icon>
                  <p class="mt-4">No s'ha pogut accedir a la càmera</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Esta sección ahora debería funcionar para todos -->
        <v-row v-if="isGroupSession && roomState" class="mt-4">
          <v-col cols="12">
            <v-card class="pa-4" elevation="3">
              <h3 class="text-h6 font-weight-bold mb-3">Estadístiques del Grup</h3>
              <v-row>
                <v-col
                  v-for="player in roomState.players"
                  :key="player.id"
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-card
                    :color="player.nickname === myNickname ? 'orange-lighten-5' : 'grey-lighten-4'"
                    flat
                    border
                  >
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      <v-icon 
                        :color="roomState.hostId === player.id ? 'amber' : 'grey'"
                        left
                      >
                        {{ roomState.hostId === player.id ? 'mdi-crown' : 'mdi-account' }}
                      </v-icon>
                      {{ player.nickname }} {{ player.nickname === myNickname ? '(Tu)' : '' }}
                    </v-card-title>
                    <v-card-text>
                      <div><strong>Reps:</strong> {{ player.reps }}</div>
                      <div><strong>Temps:</strong> {{ formatTime(player.time) }}</div>
                      <div><strong>Cals:</strong> {{ player.cals }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>


        <v-row class="mt-4">
          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card" elevation="3">
              <v-card-text class="text-center pa-6">
                <div class="stat-icon mb-3">
                  <v-icon size="48" color="#FF6600">mdi-weight-lifter</v-icon>
                </div>
                <div class="stat-value text-h3 font-weight-bold mb-2">
                  {{ exerciseCount }}
                </div>
                <div class="stat-label text-body-1 mb-4">
                  Exercicis Completats
                </div>
                <v-btn
                  color="#FF6600"
                  variant="flat"
                  block
                  size="large"
                  @click="incrementExercises"
                >
                  <v-icon class="me-2">mdi-plus</v-icon>
                  Afegir exercici
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="stat-card" elevation="3">
              <v-card-text class="text-center pa-6">
                <div class="stat-icon mb-3">
                  <v-icon size="48" color="#FF6600">mdi-timer</v-icon>
                </div>
                <div class="stat-value text-h3 font-weight-bold mb-2">
                  {{ formatTime(sessionTime) }}
                </div>
                <div class="stat-label text-body-1 mb-4">
                  Temps de Sessió
                </div>
                <div class="timer-buttons">
                  <v-btn
                    color="success"
                    variant="flat"
                    :disabled="isTimerRunning"
                    @click="startTimer"
                    size="small"
                  >
                    <v-icon class="me-1">mdi-play</v-icon>
                    Iniciar
                  </v-btn>
                  <v-btn
                    color="warning"
                    variant="flat"
                    :disabled="!isTimerRunning"
                    @click="pauseTimer"
                    size="small"
                  >
                    <v-icon class="me-1">mdi-pause</v-icon>
                    Pausar
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="12" md="4">
            <v-card class="stat-card" elevation="3">
              <v-card-text class="text-center pa-6">
                <div class="stat-icon mb-3">
                  <v-icon size="48" color="#FF6600">mdi-fire</v-icon>
                </div>
                <div class="stat-value text-h3 font-weight-bold mb-2">
                  {{ caloriesBurned }}
                </div>
                <div class="stat-label text-body-1 mb-4">
                  Calories Cremades
                </div>
                <v-btn
                  color="error"
                  variant="outlined"
                  block
                  size="large"
                  @click="resetStats"
                >
                  <v-icon class="me-2">mdi-refresh</v-icon>
                  Reiniciar
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <v-row class="mt-6">
          <v-col cols="12" class="text-center">
            <v-btn
              color="#FF6600"
              size="large"
              variant="flat"
              @click="finalitzarSessio"
            >
              <v-icon class="me-2">mdi-flag-checkered</v-icon>
              Finalitzar Sessió
            </v-btn>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.video-card,
.camera-card {
  border-radius: 12px;
  overflow: hidden;
}

.video-player,
.camera-player {
  width: 100%;
  height: 360px;
  object-fit: contain;
  background: #000;
  display: block;
}

.camera-container {
  position: relative;
  min-height: 360px;
  background: #000;
}

.camera-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 360px;
  color: #999;
}

.stat-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-value {
  color: #FF6600;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.timer-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.v-toolbar-title) {
  color: white !important;
}

:deep(.v-btn) {
  color: white !important;
}

:deep(.v-app-bar .v-btn .v-icon) {
  color: white !important;
}

/* Estils per a les targetes d'estadístiques de grup (del teu original) */
.v-card-text div {
  line-height: 1.6;
}
</style>

