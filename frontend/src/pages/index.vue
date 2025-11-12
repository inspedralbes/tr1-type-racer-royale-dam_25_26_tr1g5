<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const goFinder = () => router.push({ name: 'BuscadorExercici' })
</script>

<template>
  <v-app>
    <NavBar />
    <v-main class="bg-grey-lighten-5">
      <v-container class="fill-height d-flex align-center justify-center">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8" class="text-center welcome-container">
            <v-img src="/fitcamicon.png" contain max-height="180" class="mb-8" />
            <h1 class="text-h3 text-md-h2 font-weight-bold mb-4" style="color:#FF6600">Benvinguts a FitCam</h1>
            <p class="text-h6 text-grey-darken-2 font-weight-light mb-10 mx-auto" style="max-width:600px;">
              La teva solució intel·ligent per a un entrenament perfecte.
            </p>
            <v-btn color="#FF6600" size="x-large" elevation="3" @click="goFinder">
              <v-icon start>mdi-magnify</v-icon> Explorar Exercicis
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.welcome-container {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px)
  }

  to {
    opacity: 1;
    transform: translateY(0)
  }
}
</style>