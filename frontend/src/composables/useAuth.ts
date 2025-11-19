import { ref, computed } from 'vue'

type User = { id: number; nom: string; mail: string }
type LoginResp = { token: string; user: User }
type ApiErr = { error?: string; message?: string }

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const jwt = ref<string | null>(null)
const user = ref<User | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

function load() {
  if (typeof window === 'undefined') return
  
  // Llegeix amb la clau correcta
  jwt.value = localStorage.getItem('fitcam_token') // <-- CANVIAT
  
  // Intenta llegir l'usuari (si el guardem sencer)
  const u = localStorage.getItem('fitcam_user') // <-- CANVIAT
  user.value = u ? JSON.parse(u) as User : null
}

function persist() {
  if (typeof window === 'undefined') return
  
  // Guarda amb la clau correcta que espera el router
  if (jwt.value) localStorage.setItem('fitcam_token', jwt.value) // <-- CANVIAT
  
  // Guarda l'usuari amb una clau consistent
  if (user.value) {
    localStorage.setItem('fitcam_user', JSON.stringify(user.value)) // <-- CANVIAT
    // Guarda el nom per a BuscadorExercici.vue
    localStorage.setItem('userName', user.value.nom) // <-- AFEGIT
  }
}

function clear() {
  if (typeof window === 'undefined') return
  
  // Neteja totes les claus correctes
  localStorage.removeItem('fitcam_token') // <-- CANVIAT
  localStorage.removeItem('fitcam_user') // <-- CANVIAT
  localStorage.removeItem('userName') // <-- AFEGIT
}

async function postJson<T>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const d = await r.json() as T | ApiErr
  if (!r.ok) throw new Error((d as ApiErr).error ?? (d as ApiErr).message ?? 'Error')
  return d as T
}

async function register(nom: string, mail: string, password: string) {
  loading.value = true; errorMsg.value = null
  try {
    await postJson(`${API}/auth/register`, { nom, mail, password })
  } catch (e: any) { errorMsg.value = e.message; throw e } finally { loading.value = false }
}

async function login(mail: string, password: string) {
  loading.value = true; errorMsg.value = null
  try {
    const d = await postJson<LoginResp>(`${API}/auth/login`, { mail, password })
    jwt.value = d.token; 
    
    // Assegura't que el server retorna 'nom' i 'mail' (o 'email')
    // El teu server.js retorna 'nom' i 'email', però la teva 'User' type diu 'mail'
    // Aquest codi intenta gestionar les dues coses:
    user.value = {
      id: d.user.id,
      nom: d.user.nom,
      mail: (d.user as any).email || d.user.mail // Accepta 'email' o 'mail'
    }
    
    persist() // <-- Ara guardarà amb les claus correctes
  } catch (e: any) { errorMsg.value = e.message; throw e } finally { loading.value = false }
}

function logout() { 
  jwt.value = null; 
  user.value = null; 
  clear() // <-- Ara neteja les claus correctes
}

const isLoggedIn = computed(() => !!jwt.value && !!user.value)

function getCurrentUser() { 
  // Si refresquem la pàgina, 'user' és nul. Carrega'l des de localStorage.
  if (!user.value) load()
  return user.value 
}

// Càrrega inicial per si l'usuari refresca la pàgina
load()

export function useAuth() {
  return { loading, errorMsg, user, isLoggedIn, register, login, logout, getCurrentUser }
}