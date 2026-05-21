<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import type { Card } from '@/types/scenario'

const props = defineProps<{
  modelValue: Card[]
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: Card[]): void
}>()

const CARD_WIDTH = 140
const NORMAL_GAP = 12
const MIN_VISIBLE = 42

const trackRef = ref<HTMLElement | null>(null)
const trackWidth = ref(0)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!trackRef.value) return
  trackWidth.value = trackRef.value.clientWidth
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      trackWidth.value = entry.contentRect.width
    }
  })
  resizeObserver.observe(trackRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const stepMargin = computed<number>(() => {
  const n = props.modelValue.length
  if (n <= 1) return NORMAL_GAP
  const naturalWidth = n * CARD_WIDTH + (n - 1) * NORMAL_GAP
  if (naturalWidth <= trackWidth.value || trackWidth.value === 0) {
    return NORMAL_GAP
  }
  const available = trackWidth.value - CARD_WIDTH
  const stride = available / (n - 1)
  const margin = stride - CARD_WIDTH
  const minMargin = MIN_VISIBLE - CARD_WIDTH
  return Math.max(margin, minMargin)
})

const listStyle = computed(() => ({
  '--card-step': `${stepMargin.value}px`,
}))
</script>

<template>
  <section class="player-hand" :aria-disabled="disabled">
    <div ref="trackRef" class="hand-track">
      <draggable
        :model-value="modelValue"
        :item-key="(c: Card) => c.id"
        :group="{ name: 'cards', pull: !disabled, put: !disabled }"
        :disabled="disabled"
        class="card-list"
        :style="listStyle"
        ghost-class="card-ghost"
        @update:model-value="(v: Card[]) => $emit('update:modelValue', v)"
      >
        <template #item="{ element, index }">
          <article
            class="card"
            :data-card-id="element.id"
            :style="{ '--i': index }"
          >
            <p>{{ element.text }}</p>
          </article>
        </template>
      </draggable>
      <p v-if="modelValue.length === 0" class="empty">Hand is empty.</p>
    </div>
  </section>
</template>

<style scoped>
.player-hand {
  position: relative;
  width: 100%;
  padding: 0.4rem 1rem 0.6rem;
  background: linear-gradient(180deg, rgba(20, 14, 6, 0) 0%, rgba(20, 14, 6, 0.12) 80%);
  box-sizing: border-box;
  pointer-events: auto;
}
.hand-track {
  position: relative;
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.card-list {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 110px;
  width: 100%;
}
.card-list > .card + .card {
  margin-left: var(--card-step, 12px);
}
.card {
  position: relative;
  flex: 0 0 auto;
  width: 140px;
  height: 110px;
  border: 1px solid #6c5325;
  border-radius: 8px;
  padding: 0.55rem 0.6rem;
  background: linear-gradient(180deg, #fff8e3 0%, #f1dba2 100%);
  color: #2b1d05;
  cursor: grab;
  font-size: 0.88rem;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 140ms ease, box-shadow 140ms ease, z-index 0s linear 140ms;
  z-index: calc(var(--i, 0) + 1);
  box-sizing: border-box;
}
.card > p {
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
.card:hover {
  transform: translateY(-14px);
  z-index: 100;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: transform 140ms ease, box-shadow 140ms ease, z-index 0s;
}
.card:active {
  cursor: grabbing;
}
.card-ghost {
  opacity: 0.35;
}
.empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8b48a;
  font-style: italic;
  margin: 0;
  pointer-events: none;
}
.player-hand[aria-disabled='true'] .card {
  cursor: not-allowed;
  filter: saturate(0.6) brightness(0.95);
}
</style>
