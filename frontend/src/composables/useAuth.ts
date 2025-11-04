import { ref, computed } from 'vue'

type User = { id: number; nom: string; mail: string }
type LoginResp = { token: string; user: User }
type ApiErr = { error?: string; message?: string }

const API = 'http://localhost:3001/api'
const jwt = ref<string | null>(null)
const user = ref<User | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

function load() {
  if (typeof window === 'undefined') return
  jwt.value = localStorage.getItem('token')
  const u = localStorage.getItem('user')
  user.value = u ? JSON.parse(u) as User : null
}
function persist() {
  if (typeof window === 'undefined') return
  if (jwt.value) localStorage.setItem('token', jwt.value)
  if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
}
function clear() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
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
    jwt.value = d.token; user.value = d.user; persist()
  } catch (e: any) { errorMsg.value = e.message; throw e } finally { loading.value = false }
}
function logout() { jwt.value = null; user.value = null; clear() }

const isLoggedIn = computed(() => !!jwt.value && !!user.value)
function getCurrentUser() { return user.value }

load()

export function useAuth() {
  return { loading, errorMsg, user, isLoggedIn, register, login, logout, getCurrentUser }
}
