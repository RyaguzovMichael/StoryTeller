<script setup lang="ts">
import SystemNotificationManager from '@/components/system/SystemNotificationManager.vue'
</script>

<template>
  <RouterView />
  <SystemNotificationManager />
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
