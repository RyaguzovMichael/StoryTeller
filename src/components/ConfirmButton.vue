<script setup lang="ts">
defineProps<{
  disabled?: boolean
  label?: string
}>()

defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <button
    type="button"
    class="confirm-button"
    :disabled="disabled"
    @click="$emit('confirm')"
  >
    {{ label ?? 'Confirm' }}
  </button>
</template>

<style scoped>
.confirm-button {
  padding: 0.5rem 1.25rem;
  background: #0033aa;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.confirm-button:disabled {
  background: #888;
  cursor: not-allowed;
}
</style>
