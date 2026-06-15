<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Card } from '@/engine/types/scenario'

defineProps<{
  text: string
  tableau: Card[]
  canConfirm: boolean
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:tableau', value: Card[]): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <section class="event-panel" role="dialog" aria-modal="true" aria-label="Event">
    <header class="event-header">
      <span class="event-eyebrow">Event</span>
    </header>

    <p class="event-text">{{ text }}</p>

    <div class="event-drop" :class="{ empty: tableau.length === 0 }">
      <draggable
        :model-value="tableau"
        :item-key="(c: Card) => c.id"
        :group="{ name: 'cards', pull: !disabled, put: !disabled }"
        :sort="false"
        :disabled="disabled"
        class="drop-list"
        ghost-class="card-ghost"
        @update:model-value="(v: Card[]) => $emit('update:tableau', v)"
      >
        <template #item="{ element }">
          <article class="card played" :data-card-id="element.id">
            <p>{{ element.text }}</p>
          </article>
        </template>
      </draggable>
      <p v-if="tableau.length === 0" class="drop-hint">
        Drop a card here to play it.
      </p>
    </div>

    <footer class="event-footer">
      <button
        type="button"
        class="confirm-button"
        :disabled="!canConfirm || disabled"
        @click="$emit('confirm')"
      >
        End Turn
      </button>
    </footer>

  </section>
</template>

<style scoped>
.event-panel {
  width: min(560px, 92%);
  background: linear-gradient(180deg, var(--st-parchment) 0%, var(--st-parchment-shade) 100%);
  border: 1px solid var(--st-parchment-border);
  border-radius: 12px;
  box-shadow:
    0 16px 40px rgba(40, 25, 5, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  padding: 1rem 1.25rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  pointer-events: auto;
  animation: rise 220ms ease-out;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.event-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--st-parchment-label);
  font-weight: 700;
}
.event-text {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.45;
  color: var(--st-parchment-ink);
  font-family: Georgia, 'Iowan Old Style', serif;
}
.event-drop {
  border: 1.5px dashed var(--st-parchment-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.45);
  padding: 0.55rem;
  min-height: 96px;
  transition: background-color 150ms ease, border-color 150ms ease;
}
.event-drop.empty {
  border-style: dashed;
}
.event-drop:not(.empty) {
  border-style: solid;
  background: rgba(255, 255, 255, 0.7);
}
.drop-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 78px;
}
.drop-hint {
  margin: 0;
  padding: 1rem 0.5rem;
  text-align: center;
  color: var(--st-parchment-label);
  font-style: italic;
  font-size: 0.9rem;
}
.card.played {
  border: 1px solid var(--st-amber-border);
  background: linear-gradient(180deg, var(--st-ink-bright) 0%, var(--st-amber) 100%);
  border-radius: 6px;
  padding: 0.5rem 0.55rem;
  width: 132px;
  min-height: 78px;
  cursor: grab;
  font-size: 0.88rem;
  color: var(--st-parchment-ink-deep);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.card.played p {
  margin: 0;
}
.card-ghost {
  opacity: 0.35;
}
.event-footer {
  display: flex;
}
.confirm-button {
  flex: 1;
  padding: 0.85rem 1.4rem;
  background: linear-gradient(180deg, var(--st-wood-button-start) 0%, var(--st-wood-button-end) 100%);
  color: var(--st-ink);
  border: 1px solid var(--st-wood-edge);
  border-radius: 6px;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow:
    0 2px 6px rgba(40, 20, 0, 0.4),
    inset 0 1px 0 rgba(255, 243, 200, 0.15);
  transition: transform 80ms ease, box-shadow 120ms ease, filter 120ms ease;
}
.confirm-button:hover:not(:disabled) {
  filter: brightness(1.08);
}
.confirm-button:active:not(:disabled) {
  transform: translateY(1px);
}
.confirm-button:disabled {
  background: var(--st-disabled);
  border-color: var(--st-disabled-border);
  color: var(--st-disabled-ink);
  cursor: not-allowed;
  box-shadow: none;
}
</style>
