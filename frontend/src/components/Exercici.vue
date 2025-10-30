<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ========================================
// IMPORTS Y VARIABLES REACTIVAS
// ========================================

// Fuente de video de demostración
// Usar ruta pública (por ejemplo: colocar el archivo en public/videos/Download.mp4)
// y referenciarla como una cadena para evitar errores de tipos al importar assets.
const videoUrl = ref('/videos/Download.mp4')

// Stream de la cámara del usuario
const videoStream = ref<MediaStream | null>(null)

// Referencia al elemento <video> de la cámara
const cameraElement = ref<HTMLVideoElement | null>(null)

// Estadísticas de la sesión
const exerciseCount = ref(0)
const sessionTime = ref(0)
const caloriesBurned = ref(0)

// Estado del cronómetro
const isTimerRunning = ref(false)
// usar number | null para compatibilidad entre tipos de temporizador del navegador y Node
let intervalId: number | null = null

// ========================================
// CICLO DE VIDA DEL COMPONENTE
// ========================================
onMounted(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    videoStream.value = stream

    if (cameraElement.value) {
      cameraElement.value.srcObject = stream
    }
  } catch (error) {
    console.error('Error al acceder a la cámara:', error)
  }
})

onUnmounted(() => {
  // Liberar la cámara
  videoStream.value?.getTracks().forEach(track => track.stop())

  // Detener el cronómetro si estaba activo
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})

// ========================================
// FUNCIONES DE LÓGICA
// ========================================

// Formatea segundos en formato HH:MM:SS
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs]
    .map(unit => unit.toString().padStart(2, '0'))
    .join(':')
}

// Incrementa el contador de ejercicios
const incrementExercises = (): void => {
  exerciseCount.value++
}

// Inicia el cronómetro
const startTimer = (): void => {
  if (isTimerRunning.value) return

  isTimerRunning.value = true
  intervalId = window.setInterval(() => {
    sessionTime.value++
    if (sessionTime.value % 10 === 0) {
      caloriesBurned.value += Math.floor(Math.random() * 5) + 1
    }
  }, 1000)
}

// Pausa el cronómetro
const pauseTimer = (): void => {
  if (!isTimerRunning.value) return

  isTimerRunning.value = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}
</script>

<template>
  <div class="dark-bg">
    <div class="container">
      <!-- SECCIÓN SUPERIOR -->
      <div class="top-section">
        <!-- Video de Ejercicio -->
        <div class="box video-box">
          <h2>Video de Ejercicio</h2>
          <div class="video-container">
            <video :src="videoUrl" controls autoplay class="video-player"></video>
          </div>
        </div>

        <!-- Cámara del Usuario -->
        <div class="box camera-box">
          <h2>Tu Cámara</h2>
          <div class="camera-container">
            <video ref="cameraElement" autoplay playsinline class="camera-player"></video>
          </div>
        </div>
      </div>

      <!-- SECCIÓN INFERIOR -->
      <div class="bottom-section">
        <div class="box stats-box">
          <h2>Estadísticas de Entrenamiento</h2>

          <div class="stats-grid">
            <!-- Ejercicios -->
            <div class="stat-card">
              <div class="stat-icon">🏋️</div>
              <div class="stat-value">{{ exerciseCount }}</div>
              <div class="stat-label">Ejercicios Completados</div>
              <button @click="incrementExercises" class="increment-btn">
                + Agregar Ejercicio
              </button>
            </div>

            <!-- Cronómetro -->
            <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value">{{ formatTime(sessionTime) }}</div>
              <div class="stat-label">Tiempo de Sesión</div>

              <div class="timer-buttons">
                <button @click="startTimer" :disabled="isTimerRunning" class="timer-btn start-btn">
                  ▶ Iniciar
                </button>
                <button @click="pauseTimer" :disabled="!isTimerRunning" class="timer-btn pause-btn">
                  ⏸ Pausar
                </button>
              </div>
            </div>

            <!-- Calorías -->
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value">{{ caloriesBurned }}</div>
              <div class="stat-label">Calorías Quemadas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- ================== ESTILOS ================== -->

<style>
html, body {
  margin: 0;
  padding: 0;
  color: #f0f0f0;
  font-family: Arial, sans-serif;
}

body {
  background-color: white;
  min-height: 100vh;
}
</style>

<style scoped>
.dark-bg {
  background-color: #121212;
  min-height: 100vh;
  width: 100%;
}

.container {
  padding: 20px;
  max-width: 1500px;
  margin: 0 auto;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.bottom-section {
  width: 100%;
}

/* Cajas */
.box {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.box h2 {
  margin: 0 0 16px;
  color: #42b883;
  font-size: 24px;
  font-weight: 600;
}

.video-box, .camera-box {
  min-height: 400px;
}

.video-container, .camera-container {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player, .camera-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Estadísticas */
.stats-box {
  min-height: 250px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #2a2a2a;
  border-radius: 10px;
  padding: 28px;
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  background: #333;
}

.stat-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.stat-value {
  font-size: 48px;
  font-weight: bold;
  color: #42b883;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 16px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Botones */
.increment-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #42b883;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
}

.increment-btn:hover {
  background: #35946f;
}

.timer-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
}

.timer-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.start-btn {
  background: #42b883;
  color: #fff;
}

.start-btn:hover:not(:disabled) {
  background: #35946f;
}

.pause-btn {
  background: #f59e0b;
  color: #fff;
}

.pause-btn:hover:not(:disabled) {
  background: #d97706;
}

.timer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .top-section {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
