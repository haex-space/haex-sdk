import type { HaexVaultNuxtPlugin } from './nuxt.plugin.client'

declare module '#app' {
  interface NuxtApp {
    $haexVault: HaexVaultNuxtPlugin
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $haexVault: HaexVaultNuxtPlugin
  }
}

export {}
