<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const exerciseName = route.query.name || 'Ejercicio'

// Video demo
const videoUrl = ref('/videos/Download.mp4')

// Cámara
const videoStream = ref<MediaStream | null>(null)
const cameraElement = ref<HTMLVideoElement | null>(null)

// Stats
const exerciseCount = ref(0)
const sessionTime = ref(0)
const caloriesBurned = ref(0)
const isTimerRunning = ref(false)
let intervalId: number | null = null

onMounted(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    videoStream.value = stream
    if (cameraElement.value) cameraElement.value.srcObject = stream
  } catch (error) {
    console.error('Error al acceder a la cámara:', error)
  }
})

onUnmounted(() => {
  videoStream.value?.getTracks().forEach(track => track.stop())
  if (intervalId !== null) clearInterval(intervalId)
})

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map(u => u.toString().padStart(2,'0')).join(':')
}

const incrementExercises = () => exerciseCount.value++
const startTimer = () => {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  intervalId = window.setInterval(() => {
    sessionTime.value++
    if (sessionTime.value % 10 === 0) caloriesBurned.value += Math.floor(Math.random()*5)+1
  }, 1000)
}
const pauseTimer = () => {
  if (!isTimerRunning.value) return
  isTimerRunning.value = false
  if (intervalId !== null) { clearInterval(intervalId); intervalId = null }
}
</script>

<template>
  <div class="dark-bg">
    <h1>{{ exerciseName }}</h1>

    <div class="top-section">
      <div class="video-box">
        <h2>Video de Ejercicio</h2>
        <video :src="videoUrl" controls autoplay class="video-player"></video>
      </div>

      <div class="camera-box">
        <h2>Tu Cámara</h2>
        <video ref="cameraElement" autoplay playsinline class="camera-player"></video>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏋️</div>
        <div class="stat-value">{{ exerciseCount }}</div>
        <div class="stat-label">Ejercicios Completados</div>
        <button @click="incrementExercises" class="increment-btn">+ Agregar Ejercicio</button>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ formatTime(sessionTime) }}</div>
        <div class="stat-label">Tiempo de Sesión</div>
        <div class="timer-buttons">
          <button @click="startTimer" :disabled="isTimerRunning" class="timer-btn start-btn">▶ Iniciar</button>
          <button @click="pauseTimer" :disabled="!isTimerRunning" class="timer-btn pause-btn">⏸ Pausar</button>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ caloriesBurned }}</div>
        <div class="stat-label">Calorías Quemadas</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark-bg { background-color:#121212; min-height:100vh; padding:20px; }
.top-section { display:flex; gap:20px; margin-bottom:20px; }
.video-box, .camera-box { flex:1; }
.video-player, .camera-player { width:100%; height:300px; object-fit:contain; }
.stats-grid { display:flex; gap:20px; flex-wrap:wrap; }
.stat-card { background:#2a2a2a; padding:20px; border-radius:10px; flex:1; min-width:220px; text-align:center; }
.increment-btn, .timer-btn { margin-top:10px; padding:10px 20px; border:none; border-radius:6px; cursor:pointer; color:#fff; font-weight:600; }
.increment-btn { background:#42b883; }
.timer-btn.start-btn { background:#42b883; }
.timer-btn.pause-btn { background:#f59e0b; }
.timer-btn:disabled { opacity:0.5; cursor:not-allowed; }
</style>
