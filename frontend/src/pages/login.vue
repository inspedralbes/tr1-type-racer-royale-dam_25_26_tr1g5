<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loading, errorMsg, login, getCurrentUser } = useAuth()
const form = ref({ mail: '', password: '' })

async function submit() {
  try {
    await login(form.value.mail, form.value.password)
    router.push({ name: 'Home' })
  } catch { }
}

onMounted(() => { if (getCurrentUser()) router.replace({ name: 'Home' }) })
</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <v-container class="py-12" style="max-width:480px">
        <v-card>
          <v-card-title class="text-h6">Iniciar sessió</v-card-title>
          <v-card-text>
            <v-alert v-if="errorMsg" type="error" class="mb-3" density="comfortable">{{ errorMsg }}</v-alert>
            <v-text-field v-model="form.mail" label="Correu" type="email" variant="outlined" class="mb-3"
              :disabled="loading" />
            <v-text-field v-model="form.password" label="Contrasenya" type="password" variant="outlined"
              :disabled="loading" />
          </v-card-text>
          <v-card-actions>
            <RouterLink :to="{ name: 'Register' }" class="text-decoration-none"><v-btn variant="text">Crear
                compte</v-btn></RouterLink>
            <v-spacer />
            <v-btn color="#FF6600" variant="flat" :loading="loading" @click="submit">Entrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
