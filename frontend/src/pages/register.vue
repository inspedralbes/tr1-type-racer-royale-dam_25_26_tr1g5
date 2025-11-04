<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loading, errorMsg, register, login } = useAuth()
const form = ref({ nom: '', mail: '', password: '' })


async function submit() {
  errorMsg.value = '';
  loading.value = true;

  try {
    const r = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: form.value.nom,
        mail: form.value.mail,
        password: form.value.password
      })
    });

    if (!r.ok) {
      if (r.status === 409) throw new Error('Aquest correu ja existeix');
      throw new Error('Error de registre');
    }

    router.push({ name: 'Login' });   // o Home si vols
  } catch (e: any) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}

</script>

<template>
  <v-app>
    <NavBar />
    <v-main>
      <v-container class="py-12" style="max-width:480px">
        <v-card>
          <v-card-title class="text-h6">Crear compte</v-card-title>
          <v-card-text>
            <v-alert v-if="errorMsg" type="error" class="mb-3" density="comfortable">{{ errorMsg }}</v-alert>
            <v-text-field v-model="form.nom" label="Nom" variant="outlined" class="mb-3" :disabled="loading" />
            <v-text-field v-model="form.mail" label="Correu" type="email" variant="outlined" class="mb-3"
              :disabled="loading" />
            <v-text-field v-model="form.password" label="Contrasenya" type="password" variant="outlined"
              :disabled="loading" />
          </v-card-text>
          <v-card-actions>
            <RouterLink :to="{ name: 'Login' }" class="text-decoration-none"><v-btn variant="text">Ja tens
                compte?</v-btn></RouterLink>
            <v-spacer />
            <v-btn color="#FF6600" variant="flat" :loading="loading" @click="submit">Registrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
