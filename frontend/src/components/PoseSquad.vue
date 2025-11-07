<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as poseDetection from '@tensorflow-models/pose-detection'

/* ------------------------------------------
   ESTADO GENERAL
------------------------------------------ */
const devices = ref([])
const selectedId = ref('')
const currentStream = ref(null)
const videoEl = ref(null)
const canvasRef = ref(null)
let detector = null
let rafId = 0

const sourceMode = ref('camera')
const fileUrl = ref(null)

/* ------------------------------------------
   FUNCIONES AUXILIARES
------------------------------------------ */
function ema(prev, x, alpha = 0.2) {
  if (!Number.isFinite(x)) return prev
  if (!Number.isFinite(prev) || prev === 0) return x
  return prev * (1 - alpha) + x * alpha
}
function dist(a, b) {
  if (!a || !b) return null
  return Math.hypot(a.x - b.x, a.y - b.y)
}
function angleABC(A, B, C) {
  if (!A || !B || !C) return null
  const v1x = A.x - B.x, v1y = A.y - B.y
  const v2x = C.x - B.x, v2y = C.y - B.y
  const dot = v1x * v2x + v1y * v2y
  const m1 = Math.hypot(v1x, v1y), m2 = Math.hypot(v2x, v2y)
  if (!m1 || !m2) return null
  return Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2)))) * 180 / Math.PI
}
function normalizeKP(kp, w, h) {
  return kp ? { ...kp, nx: kp.x / w, ny: kp.y / h } : null
}

/* ------------------------------------------
   DIBUJO DEL ESQUELETO
------------------------------------------ */
function drawSkeleton(ctx, keypoints) {
  if (!ctx || !keypoints?.length) return
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const pairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#00ff88'
  for (const [i, j] of pairs) {
    const a = keypoints[i], b = keypoints[j]
    if (!a || !b || (a.score ?? 0) < 0.3 || (b.score ?? 0) < 0.3) continue
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.fillStyle = '#ffffff'
  for (const kp of keypoints) {
    if ((kp.score ?? 1) < 0.3) continue
    ctx.beginPath()
    ctx.arc(kp.x, kp.y, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

/* ------------------------------------------
   CONTADOR DE SENTADILLAS (MEJORADO)
------------------------------------------ */
const squatCount = ref(0)
let state = 'up'
let smoothedAngle = null
let _fpsEma = 0
let _prevTime = 0
let _prevNormByName = null
const currentAngle = ref(0)
const fpsDisplay = ref(0)

function smoothAngle(newAngle, alpha = 0.3) {
  if (smoothedAngle === null) smoothedAngle = newAngle
  else smoothedAngle = smoothedAngle * (1 - alpha) + newAngle * alpha
  return smoothedAngle
}

/* ------------------------------------------
   CÁMARA Y LOOP PRINCIPAL
------------------------------------------ */
async function listVideoInputs() {
  const all = await navigator.mediaDevices.enumerateDevices()
  const cams = all.filter(d => d.kind === 'videoinput')
  devices.value = cams.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }))
  if (!selectedId.value && devices.value.length) selectedId.value = devices.value[0].deviceId
}

async function startCamera(deviceId = '') {
  if (currentStream.value) currentStream.value.getTracks().forEach(t => t.stop())
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } }, audio: false }
    : { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  currentStream.value = stream
  if (videoEl.value) {
    videoEl.value.srcObject = stream
    await videoEl.value.play().catch(console.error)
  }
  await listVideoInputs()
}

function stopCurrentSource() {
  if (currentStream.value) currentStream.value.getTracks().forEach(t => t.stop())
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.srcObject = null
  }
}

async function loop() {
  const video = videoEl.value
  const canvas = canvasRef.value
  if (!video || !canvas || !detector) return rafId = requestAnimationFrame(loop)
  if (video.readyState < 2 || !video.videoWidth) return rafId = requestAnimationFrame(loop)

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }
  const ctx = canvas.getContext('2d')

  // Calcular FPS
  const tNow = performance.now()
  const dt = _prevTime ? (tNow - _prevTime) / 1000 : 0
  const fpsNow = dt > 0 ? 1 / dt : 0
  _prevTime = tNow
  _fpsEma = ema(_fpsEma, fpsNow, 0.2)
  fpsDisplay.value = _fpsEma.toFixed(1)

  let keypoints = []
  try {
    const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: true })
    keypoints = poses[0]?.keypoints ?? []
  } catch (err) { console.warn('estimatePoses error', err) }

  if (keypoints.length) drawSkeleton(ctx, keypoints)
  else ctx.clearRect(0, 0, canvas.width, canvas.height)

  const W = video.videoWidth, H = video.videoHeight
  const byName = {}, normByName = {}
  for (const kp of keypoints) {
    byName[kp.name] = kp
    normByName[kp.name] = normalizeKP(kp, W, H)
  }
  _prevNormByName = normByName

  // --- Calcular ángulos de rodillas ---
  const leftKnee = angleABC(byName['left_hip'], byName['left_knee'], byName['left_ankle'])
  const rightKnee = angleABC(byName['right_hip'], byName['right_knee'], byName['right_ankle'])
  const kneeAngle = (leftKnee && rightKnee) ? (leftKnee + rightKnee) / 2 : (leftKnee || rightKnee)
  if (!kneeAngle) return rafId = requestAnimationFrame(loop)

  const meanScore = keypoints.reduce((a, p) => a + (p.score ?? 0), 0) / keypoints.length
  if (meanScore < 0.4 || _fpsEma < 10) return rafId = requestAnimationFrame(loop)

  const filteredAngle = smoothAngle(kneeAngle)
  currentAngle.value = filteredAngle

  // --- Lógica de conteo con margen ---
  const downThreshold = 75
  const upThreshold = 165

  if (filteredAngle < downThreshold && state === 'up') {
    state = 'down'
  }

  if (filteredAngle > upThreshold && state === 'down') {
    squatCount.value++
    state = 'up'
  }

  rafId = requestAnimationFrame(loop)
}

/* ------------------------------------------
   CICLO DE VIDA
------------------------------------------ */
onMounted(async () => {
  await tf.setBackend('webgl')
  await tf.ready()
  await startCamera()
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER, enableSmoothing: true }
  )
  rafId = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  if (currentStream.value) currentStream.value.getTracks().forEach(t => t.stop())
  if (rafId) cancelAnimationFrame(rafId)
  detector?.dispose?.()
})
watch(selectedId, id => { if (id && sourceMode.value === 'camera') startCamera(id) })
</script>

<template>
  <div class="pose-wrapper">
    <div class="stage">
      <video ref="videoEl" playsinline muted autoplay class="video"></video>
      <canvas ref="canvasRef" class="overlay"></canvas>
      <div class="counter-panel">
        <h2>Repeticiones: {{ squatCount }}</h2>
      </div>
    </div>

    <div class="camera-select">
      <select v-model="selectedId">
        <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">{{ d.label }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.pose-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.stage {
  position: relative;
  width: min(100%, 650px);
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video,
.overlay {
  width: 100%;
  height: 500px;
  object-fit: contain;
}

.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.counter-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #00ff88;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  text-align: left;
  font-family: monospace;
  font-size: 1.2rem;
}
</style>
