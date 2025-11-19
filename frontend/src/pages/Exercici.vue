<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Socket } from 'socket.io-client'

interface Player {
  id: string
  nickname: string
  reps: number // Series
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

// ===========================================
// FIX: Lógica para determinar la URL del GIF
// ===========================================
const videoUrl = computed(() => {
  // 1. Obtenemos el nombre y lo pasamos a minúsculas para facilitar la búsqueda
  const rawName = (route.query.name as string || '').toLowerCase()

  // 2. Mapa de "Palabra Clave" -> "Nombre exacto del archivo GIF"
  const fileMap: Record<string, string> = {
    'sentadilla': 'sentadillaconbarra',
    'banca': 'pressbanca',
    'militar': 'pressmilitar',
    'pes-mort': 'pesomuerto',
    'remo': 'remoconbarra',
    'lateral': 'elevacioneslaterales',
    'biceps': 'curlbicepsconbarra',
    'bíceps': 'curlbicepsconbarra',
    'triceps': 'extensiontricepsenpolea',
    'tríceps': 'extensiontricepsenpolea'
  }

  // 3. Buscamos si alguna clave está contenida en el nombre del ejercicio
  for (const key in fileMap) {
    if (rawName.includes(key)) {
      return `/videos/${fileMap[key]}.gif`
    }
  }
})


const router = useRouter()
const socket = inject('socket') as Socket

// ===========================================
// FIX: exerciseName como propiedad computed
// ===========================================
const exerciseName = computed(() => (route.query.name as string) || 'Exercici')
const sessionId = ref((route.query.sessionId as string) || null)
const isGroupSession = computed(() => !!sessionId.value)

const roomState = ref<Room | null>(null)
// const myNickname = ref(localStorage.getItem('userName') || 'Tu')
const myNickname = ref('Convidat')


const videoStream = ref<MediaStream | null>(null)
const cameraElement = ref<HTMLVideoElement | null>(null)
const cameraError = ref(false)

const exerciseCount = ref(1) // Contador de les series
const sessionTime = ref(0)
const isTimerRunning = ref(false)
let intervalId: number | null = null

const repetitionCount = ref(0)

// Variable para controlar el Pop-up del video
const showVideoDialog = ref(false)

const setupSocketListeners = () => {
  socket.on('session:roomUpdate', (room: Room) => {
    roomState.value = room
  })

  socket.on('session:error', (message: string) => {
    alert(`Error de sessió: ${message}. Tornant al lobby...`)
  })

  socket.on('session:ended', () => {
    console.log("Rebut 'session:ended' del servidor.");
    if (router.currentRoute.value.name === 'Exercici') {
      // Passem 'false' per no tornar a emetre l'event
      finalitzarSessio(false);
    }
  });

  socket.emit('session:getState', sessionId.value)
}

onMounted(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    videoStream.value = stream
    if (cameraElement.value) cameraElement.value.srcObject = stream
    cameraError.value = false
  } catch (error) {
    console.error('Error al accedir a la càmera:', error)
    cameraError.value = true
  }

  if (isGroupSession.value) {
    if (socket.connected) {
      setupSocketListeners()
    } else {
      socket.on('connect', setupSocketListeners)
    }
  }
})

onUnmounted(() => {
  videoStream.value?.getTracks().forEach(track => track.stop())
  if (intervalId !== null) clearInterval(intervalId)

  if (isGroupSession.value) {
    socket.off('session:roomUpdate')
    socket.off('session:error')
    socket.off('connect')
    socket.off('session:ended')
  }
})

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map(u => u.toString().padStart(2, '0')).join(':')
}

const broadcastStats = () => {
  if (isGroupSession.value && sessionId.value && socket.connected) {
    socket.emit('exercise:updateStats', {
      roomId: sessionId.value,
      reps: exerciseCount.value,
      time: sessionTime.value
    })
  }
}

const handleSquatRep = () => {
  repetitionCount.value++
  broadcastStats()
}

const incrementExercises = () => {
  exerciseCount.value++
  broadcastStats()
}

const startTimer = () => {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  intervalId = window.setInterval(() => {
    sessionTime.value++
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

const toggleTimer = () => {
  isTimerRunning.value ? pauseTimer() : startTimer()
}

const goBack = () => {
  if (isGroupSession.value) {
    // Aquí usamos route.query.name, no exerciseName, porque es lo que espera el lobby si no se usa ID
    router.push({ name: 'SessioLobby', params: { exerciseId: route.params.id }, query: { name: route.query.name } })
  } else {
    router.push({ name: 'BuscadorExercici' })
  }
}

const finalitzarSessio = (potEmetreEvent = true) => {
  pauseTimer()

  if (potEmetreEvent && isGroupSession.value && roomState.value && roomState.value.hostId === socket.id) {
    console.log("Host finalitzant la sessió per a tothom.");
    socket.emit('session:end', { roomId: sessionId.value });
  }

  // Preparem la llista de participants
  let participantsNames = '';
  if (isGroupSession.value && roomState.value && roomState.value.players) {
    participantsNames = roomState.value.players.map(p => p.nickname).join(',');
  }

  router.push({
    name: 'ResultatsExercici',
    query: {
      tecnica: (Math.random() * 100).toFixed(1),
      reps: repetitionCount.value,
      temps: sessionTime.value,
      series: exerciseCount.value,
      nom: exerciseName.value, // Usamos .value porque ahora es computed
      id: route.params.id as string,
      sessionId: sessionId.value,
      participants: participantsNames // Passem la llista
    }
  })
}

const isFullScreen = ref(false)
const isVideoFullScreen = ref(false)
const toggleFullScreen = () => isFullScreen.value = !isFullScreen.value
// toggleVideoFullScreen no es necesaria si solo abrimos un dialog

</script>

<template>
  <v-app>
    <v-app-bar color="#FF6600" elevation="3">
      <v-container class="d-flex align-center pa-0">
        <v-btn icon @click="goBack" class="me-2"><v-icon>mdi-arrow-left</v-icon></v-btn>
        <v-toolbar-title class="text-h5 font-weight-bold">{{ exerciseName }}</v-toolbar-title>
        <v-spacer />
        <v-chip v-if="isGroupSession" color="white" text-color="orange" variant="flat">
          <v-icon left>mdi-account-group</v-icon> Grup (Codi: {{ sessionId }})
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-3" fluid>
        <v-row>
          <v-col v-if="!isFullScreen" :cols="isVideoFullScreen ? 12 : 6">
            <v-card :class="isVideoFullScreen ? 'fullscreen-card' : 'video-card'" elevation="3"></v-card>
          </v-col>

          <v-col cols="12">
            <v-card :class="isFullScreen ? 'camera-fullscreen' : 'camera-card'" elevation="1">
              <v-card-title
                class="text-h6 bg-grey-darken-3 text-white d-flex align-center justify-center justify-sm-start">
                <v-icon class="me-sm-5">mdi-camera</v-icon>
                <span class="d-none d-sm-inline">La teva càmera</span>
                <v-spacer />
                <v-btn v-if="isFullScreen" icon variant="text" @click="toggleFullScreen">
                  <v-icon>mdi-fullscreen-exit</v-icon>
                </v-btn>
              </v-card-title>


              <v-card-text class="pa-0 camera-container">
                <pose-squad v-if="!isFullScreen" @squat-completed="handleSquatRep" />
                <div v-if="isFullScreen" class="fullscreen-grid-overlay">
                  <div class="grid-item camera-middle d-flex flex-column align-center justify-center">
                    <pose-squad @squat-completed="handleSquatRep" style="width: 100%; height: 100%;" />
                    <div class="overlay-reps-counter">
                      <div class="overlay-label">Repeticions</div>
                      <div class="overlay-value">{{ repetitionCount }}</div>
                    </div>
                  </div>

                  <div class="grid-item rect-right d-flex flex-column justify-start pa-3">
                    <h4 class="text-h6 mb-3 font-weight-bold">{{ isGroupSession ? 'Estadístiques del Grup' : 'Sessió Individual' }}</h4>
                    <div v-if="isGroupSession && roomState" class="player-stats-list">
                      <v-card v-for="player in roomState.players" :key="player.id"
                        :color="player.nickname === myNickname ? 'orange-lighten-5' : 'grey-lighten-4'" flat border
                        class="mb-2 player-stat-card">
                        <v-card-title class="text-subtitle-2 font-weight-bold pa-2">
                          <v-icon :color="roomState.hostId === player.id ? 'amber' : 'grey'" left size="small">
                            {{ roomState.hostId === player.id ? 'mdi-crown' : 'mdi-account' }}
                          </v-icon>
                          {{ player.nickname }} {{ player.nickname === myNickname ? '(Tu)' : '' }}
                        </v-card-title>
                        <v-card-text class="pa-2 text-caption">
                          <div><strong>Sèries:</strong> {{ player.reps }}</div>
                          <div><strong>Temps:</strong> {{ formatTime(player.time) }}</div>
                        </v-card-text>
                      </v-card>
                    </div>
                    <div v-else-if="isGroupSession && !roomState" class="text-caption">Esperant dades del grup...</div>
                    <div v-else class="text-caption">No hi ha estadístiques de grup en mode individual.</div>
                  </div>

                  <div class="grid-item box-bottom d-flex justify-around align-center pa-3">
                    <div class="overlay-stat-item text-center">
                      <div class="overlay-value">{{ formatTime(sessionTime) }}</div>
                      <div class="overlay-label">Temps</div>
                    </div>
                    <div class="overlay-stat-item text-center">
                      <v-btn :color="isTimerRunning ? 'warning' : 'success'" variant="flat" size="large"
                        @click="toggleTimer" class="mb-2" style="pointer-events: all;">
                        <v-icon class="me-2">{{ isTimerRunning ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                        {{ isTimerRunning ? 'Pausar' : 'Iniciar' }}
                      </v-btn>
                    </div>
                    <div class="overlay-stat-item text-center d-flex flex-column align-center">
                      <div class="overlay-value">{{ exerciseCount }}</div>
                      <div class="overlay-label">Series</div>
                      <v-btn color="#FF6600" variant="flat" size="small" @click="incrementExercises" class="mt-2"
                        style="pointer-events: all; color: white !important; min-width: 40px;">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
                <v-btn v-if="!isFullScreen" icon variant="text" class="fullscreen-btn" @click="toggleFullScreen">
                  <v-icon>{{ isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="isGroupSession && roomState" class="mt-4">
          <v-col cols="12">
            <v-card class="pa-4" elevation="3">
              <h3 class="text-h6 font-weight-bold mb-3">Estadístiques del Grup</h3>
              <v-row>
                <v-col v-for="player in roomState.players" :key="player.id" cols="12" sm="6" md="3">
                  <v-card :color="player.nickname === myNickname ? 'orange-lighten-5' : 'grey-lighten-4'" flat border>
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      <v-icon :color="roomState.hostId === player.id ? 'amber' : 'grey'" left>
                        {{ roomState.hostId === player.id ? 'mdi-crown' : 'mdi-account' }}
                      </v-icon>
                      {{ player.nickname }} {{ player.nickname === myNickname ? '(Tu)' : '' }}
                    </v-card-title>
                    <v-card-text>
                      <div><strong>Sèries:</strong> {{ player.reps }}</div>
                      <div><strong>Temps:</strong> {{ formatTime(player.time) }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-4" align="center">
          <v-col cols="4">
            <v-card class="stat-card" elevation="3">
              <v-card-text class="text-center pa-6">
                <div class="stat-icon mb-3"><v-icon size="32" color="#FF6600">mdi-timer</v-icon></div>
                <div class="stat-value text-h5 font-weight-bold mb-2">{{ formatTime(sessionTime) }}</div>
                <div class="stat-label text-body-1 mb-4">Temps de Sessió</div>
                <div class="timer-buttons">
                  <v-btn :color="isTimerRunning ? 'warning' : 'success'" variant="flat" @click="toggleTimer"
                    size="small">
                    <v-icon class="me-1">{{ isTimerRunning ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                    {{ isTimerRunning ? 'Pausar' : 'Iniciar' }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="4" class="d-flex flex-column align-center justify-center">
            <v-btn color="#FF6600" size="large" variant="flat" class="mb-2" @click="showVideoDialog = true">
              <v-icon class="me-2">mdi-play-circle</v-icon> Demostració del exercici
            </v-btn>
            <v-btn color="#FF6600" size="large" variant="flat" @click="finalitzarSessio()">
              <v-icon class="me-2">mdi-flag-checkered</v-icon> Finalitzar Sessió
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-card class="stat-card" elevation="3">
              <v-card-text class="text-center pa-6">
                <div class="stat-icon mb-3"><v-icon size="32" color="#FF6600">mdi-weight-lifter</v-icon></div>
                <div class="stat-value text-h5 font-weight-bold mb-2">{{ exerciseCount }}</div>
                <div class="stat-label text-body-1 mb-4">Series</div>
                <v-btn color="#FF6600" variant="flat" block class="py-2 text-body-2" @click="incrementExercises">
                  <v-icon>mdi-plus</v-icon> Afegir Sèrie
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-dialog v-model="showVideoDialog" max-width="800px" z-index="20000">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center bg-grey-darken-3 text-white">
              <span class="text-h6">Demostració: {{ exerciseName }}</span>
              <v-btn icon="mdi-close" variant="text" @click="showVideoDialog = false"></v-btn>
            </v-card-title>

            <v-card-text class="pa-0 bg-black d-flex justify-center align-center" style="min-height: 300px;">
              <img 
                :src="videoUrl"
                alt="Animació de l'exercici"
                style="width: 100%; max-height: 80vh; object-fit: contain;"
              />
            </v-card-text>
          </v-card>
        </v-dialog>

      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Estilos de cámara y video */
.video-card,
.camera-card {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  /* Añadido para posicionar el botón de fullscreen */
}

/* Contenedores de video y cámara para posicionar el botón */
.video-player-container,
.camera-container {
  position: relative;
  min-height: 415px;
  /* Asegura un alto mínimo si no hay contenido */
  background: #000;
  height: 100%;
  display: flex;
  /* Añadido para que el contenido dentro se ajuste bien */
  align-items: center;
  /* Centra el contenido verticalmente */
  justify-content: center;
  /* Centra el contenido horizontalmente */
}

.video-player {
  width: 100%;
  height: 415px;
  object-fit: contain;
  background: #000;
  display: block;
}

.camera-player {
  /* Este estilo parece no usarse directamente en el template actual, pero lo mantengo */
  width: 100%;
  height: 415px;
  object-fit: contain;
  min-height: 415px;
  background: #000;
  display: block;
}

.camera-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 415px;
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

.v-card-text div {
  line-height: 1.6;
  /* Estilos de fullscreen para video */
}

.fullscreen-card {
  position: fixed;
  top: 0;
  /* Ajustado para empezar desde arriba */
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #000;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.fullscreen-card .v-card-title {
  flex-shrink: 0;
  /* Asegura que el título no se encoja */
}

.fullscreen-card .v-card-text {
  flex-grow: 1;
  /* Permite que el contenido ocupe el espacio restante */
  height: auto;
  /* Anula la altura fija si la hubiera */
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-card .v-card-text {
  flex-grow: 1;
  /* Permite que el contenido ocupe el espacio restante */
  height: auto;
  /* Anula la altura fija si la hubiera */
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-card .video-player {
  width: 100%;
  height: 100%;
  /* El video/cámara ocupa todo el espacio disponible */
  object-fit: contain;
}

.fullscreen-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  z-index: 10;
  /* Asegura que esté por encima del contenido */
}

/* -------------------------------- */

/* --- [NOU] ESTILS PER A CAMERA FULLSCREEN --- */
.camera-fullscreen {
  position: fixed;
  top: 64px;
  /* Per deixar espai a la v-app-bar */
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #000;
  border-radius: 0;
}

.camera-player-full {
  width: 100%;
  height: calc(100vh - 64px);
  object-fit: contain;
  background: #000;
}

/* -------------------------------- */
/* --- [CANVIAT] NOU DISSENY DEL GRID OVERLAY --- */

.fullscreen-grid-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  /* 2 columnes: càmera + stats dreta */
  grid-template-rows: 2fr 1fr;
  /* 2 files: contingut superior + barra inferior */
  grid-template-areas:
    "middle right"
    "bottom bottom";
  color: white;
  pointer-events: none;
  gap: 10px;
  padding: 10px;
  background: #000;
  height: 100%;
  box-sizing: border-box;
}

/* -------------------------------- */

.grid-item {
  pointer-events: all;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 16px;
  min-height: 0;
}

.rect-left {
  grid-area: left;
  border: 1px dashed #00ff88;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.camera-middle {
  grid-area: middle;
  position: relative;
  background: #000;
  padding: 0;
  /* Eliminado el borde de depuración, si lo quieres lo puedes añadir: border: 2px solid red; */
  overflow: hidden;
}

.rect-right {
  grid-area: right;
  /* Eliminado el borde de depuración */
  overflow: hidden;
  /* [CANVI] Afegit per permetre l'scroll intern si la llista és llarga */
  display: flex;
  flex-direction: column;
}

.box-bottom {
  grid-area: bottom;
  /* Eliminado el borde de depuración */
  display: flex;
  align-items: center;
  justify-content: center;
  /* Centrat per defecte, el v-if ho canvia */
  gap: 3rem;
  padding: 4px 16px;
}

.overlay-stat-top {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: all;
  width: 100%;
}

.overlay-stat-item {
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 1);
}

.overlay-value {
  font-size: 3rem;
  font-weight: bold;
  line-height: 1.1;
  text-align: center;
  /* FIX: Alinea el texto al centro */
  width: 100%;
  /* FIX: Asegura que tenga espacio para centrarse */
  display: block;
  /* FIX: Asegura comportamiento de bloque */
}

.overlay-label {
  font-size: 1.1rem;
  font-weight: 500;
  text-transform: uppercase;
}

/* --- [CANVIAT] Estils de font per a la barra inferior --- */
.box-bottom .overlay-value {
  font-size: 2.8rem;
  line-height: 1.1;
}

.box-bottom .overlay-label {
  font-size: 1.1rem;
}

/* -------------------------------- */

.box-bottom .v-btn {
  margin-top: 4px !important;
}
</style>