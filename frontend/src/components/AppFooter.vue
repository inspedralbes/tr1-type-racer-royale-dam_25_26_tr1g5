<script setup lang="ts">
import { computed } from 'vue'

// Props opcionals per reutilitzar a totes les pàgines
const props = defineProps<{
  compact?: boolean
}>()

const year = new Date().getFullYear()
const height = computed(() => (props.compact ? 56 : 72))

const socials = [
  { title: 'GitHub', icon: 'mdi-github', href: 'https://github.com/fitcam' },
  { title: 'Instagram', icon: 'mdi-instagram', href: 'https://instagram.com/fitcam' },
  { title: 'X', icon: 'mdi-twitter', href: 'https://x.com/fitcam' },
]

const links = [
  { text: 'Exercicis', to: { name: 'BuscadorExercici' } },
  { text: 'Rutines', to: { name: 'Rutines' } },
  { text: 'Suport', to: { name: 'Support' } },
]
</script>

<template>
  <v-footer app :height="height" elevation="0" class="footer-gradient px-4">
    <v-container class="py-0" fluid>
      <v-row align="center" no-gutters>
        <!-- Marca -->
        <v-col cols="12" md="4" class="d-flex align-center py-3">
          <v-img src="/fitcamicon.png" max-width="36" max-height="36" class="me-3" alt="FitCam" />
          <div class="d-flex flex-column">
            <strong class="text-white">FitCam</strong>
            <span class="text-white text-caption" style="opacity: .8">Mou-te amb càmera</span>
          </div>
        </v-col>

        <!-- Links ràpids (desktop) -->
        <v-col cols="12" md="4" class="d-none d-md-flex justify-center py-3">
          <v-btn
            v-for="l in links"
            :key="l.text"
            :to="l.to"
            variant="text"
            size="small"
            class="text-none text-white mx-1"
          >
            {{ l.text }}
          </v-btn>
        </v-col>

        <!-- Socials -->
        <v-col cols="12" md="4" class="d-flex justify-end align-center py-3">
          <a
            v-for="s in socials"
            :key="s.title"
            class="social-link d-inline-flex align-center justify-center"
            :href="s.href"
            target="_blank"
            rel="noopener noreferrer"
            :title="s.title"
          >
            <v-icon :icon="s.icon" size="20" />
          </a>
        </v-col>
      </v-row>

      <v-divider class="my-2" opacity="0.1" />

      <v-row class="py-1" no-gutters>
        <v-col cols="12" md="6" class="text-white text-caption">
          © 2025 - {{ year }} · FitCam · Tots els drets reservats
        </v-col>
        <v-col cols="12" md="6" class="text-white text-caption text-md-right mt-1 mt-md-0" style="opacity:.8">
          <router-link class="legal-link" :to="{ name: 'Privacitat' }">Privacitat</router-link>
          ·
          <router-link class="legal-link" :to="{ name: 'Termes' }">Termes</router-link>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-gradient {
  background: linear-gradient(90deg, #FF6600 0%, #ff7f32 100%);
}
.social-link {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  margin-left: 4px;
  margin-right: 4px;
  transition: transform .2s ease, background-color .2s ease;
  color: white;
}
.social-link:hover {
  transform: translateY(-2px);
  background-color: rgba(255,255,255,.12);
}
.legal-link {
  color: white;
  text-decoration: none;
}
.legal-link:hover { text-decoration: underline; }
</style>
