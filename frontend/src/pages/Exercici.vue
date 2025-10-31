<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const exerciseName = (route.query.name as string) || 'Exercici'

const videoUrl = ref('/videos/Download.mp4')

const videoStream = ref<MediaStream | null>(null)
const cameraElement = ref<HTMLVideoElement | null>(null)
const cameraError = ref(false)

const exerciseCount = ref(0)
const sessionTime = ref(0)
const caloriesBurned = ref(0)
const isTimerRunning = ref(false)
let intervalId: number | null = null

onMounted(async () => {
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
})

onUnmounted(() => {
  videoStream.value?.getTracks().forEach(track => track.stop())
  if (intervalId !== null) clearInterval(intervalId)
})

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map(u => u.toString().padStart(2, '0')).join(':')
}

const incrementExercises = () => {
  exerciseCount.value++
  caloriesBurned.value += Math.floor(Math.random() * 3) + 2
}

const startTimer = () => {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  intervalId = window.setInterval(() => {
    sessionTime.value++
    if (sessionTime.value % 10 === 0) {
      caloriesBurned.value += Math.floor(Math.random() * 5) + 1
    }
  }, 1000)
}

const pauseTimer = () => {
  if (!isTimerRunning.value) return
  isTimerRunning.value = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const resetStats = () => {
  pauseTimer()
  exerciseCount.value = 0
  sessionTime.value = 0
  caloriesBurned.value = 0
}

const goBack = () => {
  router.push({ name: 'BuscadorExercici' })
}
const finalitzarSessio = () => {
  pauseTimer()
  router.push({
    name: 'ResultatsExercici',
    query: {
      tecnica: (Math.random() * 100).toFixed(1), // simulació del % de tècnica
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
      </v-container>
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
</style>
