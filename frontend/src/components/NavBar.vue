<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isLoggedIn, logout } = useAuth()
const userName = computed(() => user.value?.nom ?? '')

function nav(name: string) {
  router.push({ name })
}
function doLogout() {
  logout()
  nav('Home')
}
</script>

<template>
  <v-app-bar color="#FF6600" flat height="80" class="px-4">
    <!-- LOGO GRAN -->
    <v-img
      src="/fitcamicon.png"
      max-width="140"
      max-height="140"
      class="me-4"
      style="cursor: pointer"
      @click="nav('Home')"
      contain
    />

    <v-spacer />

    <!-- BOTÓ BUSCADOR -->
    <v-btn
      variant="text"
      class="text-none text-white"
      @click="nav('BuscadorExercici')"
    >
      <v-icon start>mdi-magnify</v-icon>
      Exercicis
    </v-btn>

    <!-- USUARI -->
    <template v-if="isLoggedIn">
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" class="text-none text-white" variant="text">
            <v-icon start>mdi-account-circle</v-icon>
            {{ userName }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="doLogout" class="text-error">Surt</v-list-item>
        </v-list>
      </v-menu>
    </template>

    <!-- LOGIN / REGISTER -->
    <template v-else>
      <v-btn variant="text" class="text-none text-white" @click="nav('Login')">
        Iniciar sessió
      </v-btn>
      <v-btn
        variant="outlined"
        class="text-none"
        style="border-color: white; color: white"
        @click="nav('Register')"
      >
        Registrar-se
      </v-btn>
    </template>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  align-items: center;
}

/* millora l'alineació i espai */
.v-btn {
  font-weight: 500;
  letter-spacing: 0.3px;
}
</style>
