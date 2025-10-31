<script setup lang="ts">
import { ref } from 'vue' // Afegit 'ref'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- Lògica del Login (copiada de buscadorexercici) ---
const loginDialog = ref(false)
const tempName = ref('')
const userName = ref('')

const login = () => {
  if (tempName.value.trim()) {
    userName.value = tempName.value.trim()
    tempName.value = ''
    loginDialog.value = false
  }
}
// --- Fi de la lògica del Login ---

/**
 * Navega a la pàgina principal del cercador d'exercicis.
 * S'assumeix que la ruta es diu 'BuscadorExercici', basant-se
 * en el codi de 'Exercici.vue'.
 */
const goToFinder = () => {
  router.push({ name: 'BuscadorExercici' })
}
</script>

<template>
  <v-app>
    <!-- 
      Barra de navegació actualitzada, igual a la de buscadorexercici
    -->
    <v-app-bar app color="#FF6600" flat>
      <v-img
        src="/fitcamicon.png"
        alt="FitCam"
        contain
        max-height="128"
        max-width="128"
        class="me-2"
      ></v-img>

      <v-toolbar-title class="text-white text-h5 font-weight-bold">
        FitCam
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn color="white" text class="text-none" @click="loginDialog = true">
        {{ userName ? `Hola, ${userName}` : 'Log In / Registrar-se' }}
      </v-btn>
    </v-app-bar>

    <!-- Contingut principal centrat vertical i horitzontalment -->
    <v-main class="bg-grey-lighten-5">
      <v-container class="fill-height d-flex align-center justify-center">
        <v-row justify="center">
          <v-col
            cols="12"
            md="10"
            lg="8"
            class="text-center welcome-container"
          >
            <!-- Logotip principal -->
            <v-img
              src="/fitcamicon.png"
              alt="FitCam Logo"
              contain
              max-height="180"
              class="mb-8"
            ></v-img>

            <!-- Títol principal -->
            <h1
              class="text-h3 text-md-h2 font-weight-bold mb-4"
              style="color: #FF6600"
            >
              Benvingut/da a FitCam
            </h1>

            <!-- Subtítol descriptiu -->
            <p class="text-h6 text-grey-darken-2 font-weight-light mb-10 mx-auto" style="max-width: 600px;">
              La teva solució intel·ligent per a un entrenament perfecte. <br />
              Fes seguiment, millora la teva forma i assoleix els teus objectius.
            </p>

            <!-- Botó de Crida a l'Acció (CTA) -->
            <v-btn
              color="#FF6600"
              size="x-large"
              elevation="3"
              @click="goToFinder"
            >
              <v-icon start>mdi-magnify</v-icon>
              Explorar Exercicis
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Diàleg de Login (copiat de buscadorexercici) -->
    <v-dialog v-model="loginDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6 pa-4">
          Iniciar sessió / Registrar-se
        </v-card-title>
        <v-card-text class="pb-2">
          <v-text-field
            v-model="tempName"
            label="Nom d'usuari"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="loginDialog = false">
            Cancel·lar
          </v-btn>
          <v-btn color="#FF6600" variant="flat" @click="login">
            Acceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
/* Aquesta regla :deep(.v-btn) aplicarà el color blanc
  tant al botó de 'Log In' com al botó 'Explorar Exercicis'.
*/
:deep(.v-btn) {
  color: white !important;
}

/* Títol amb el color corporatiu */
.text-h3 {
  color: #FF6600;
}

/* Una animació subtil per donar la benvinguda */
.welcome-container {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

