<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { COPY } from '@/content/copy';
import { SCULPTURES } from '@/content/sculptures';
import { device } from '@/core/Device';
import { store, actions } from '@/core/store';
import { navigate } from '@/core/router';

const rows = device.isTouch ? COPY.immersive.mobileHint : COPY.immersive.desktopHint;
const visible = ref(true);
let timer = 0;

// the hint card hides itself after the visitor starts moving, or after a while
function dismiss() {
  visible.value = false;
  actions.setControlsHint(false);
}
const onKey = (e: KeyboardEvent) => {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) dismiss();
};
onMounted(() => {
  window.addEventListener('keydown', onKey);
  timer = window.setTimeout(dismiss, 9000);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  clearTimeout(timer);
});

const near = computed(() => (store.nearSculpture !== null ? SCULPTURES[store.nearSculpture] : null));
</script>

<template>
  <div class="immersive">
    <Transition name="hint">
      <div v-if="visible && store.showControlsHint" class="card" @pointerdown="dismiss">
        <div v-for="r in rows" :key="r.label" class="row">
          <span class="keys">
            <kbd v-for="k in r.keys" :key="k" :class="{ wide: k.length > 2 }">{{ k }}</kbd>
          </span>
          <span class="label">{{ r.label }}</span>
        </div>
      </div>
    </Transition>

    <!-- zone indicator: appears when the swimmer enters a sculpture's area -->
    <Transition name="zone">
      <button v-if="near" :key="near.id" class="zone" @click="navigate('sculptures', store.nearSculpture)">
        <span class="ring" />
        <span class="zone-title">{{ near.title }}</span>
        <span class="zone-sub">{{ near.subtitle }}</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.immersive {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.card {
  position: absolute;
  left: 50%;
  bottom: calc(var(--row) * 4);
  transform: translateX(-50%);
  display: flex;
  gap: clamp(18px, 3vw, 48px);
  padding: 18px 28px;
  border: 1px solid var(--panel-edge);
  background: var(--panel);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  pointer-events: auto;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.keys {
  display: flex;
  gap: 4px;
}
kbd {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border: 1px solid #a7d3e688;
  border-radius: 6px;
  font: 400 0.72rem/1 var(--font-text);
  color: var(--ink);
  box-shadow: inset 0 -2px 0 #5ad2f633;
  animation: press 2.4s infinite;
}
kbd:nth-child(2) { animation-delay: 0.3s; }
kbd:nth-child(3) { animation-delay: 0.6s; }
kbd:nth-child(4) { animation-delay: 0.9s; }
kbd.wide {
  min-width: 52px;
}
@keyframes press {
  0%, 70%, 100% { transform: none; background: transparent; }
  80% { transform: translateY(1px); background: #5ad2f633; }
}
.label {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.zone {
  position: absolute;
  left: 50%;
  top: 20%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
  text-shadow: 0 1px 8px #00142a;
}
.ring {
  width: 34px;
  height: 34px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  position: relative;
  margin-bottom: 8px;
}
.ring::before,
.ring::after {
  content: '';
  position: absolute;
  inset: -1px;
  border: 1px solid var(--accent);
  border-radius: 50%;
  animation: sonar 2.4s var(--ease-out) infinite;
}
.ring::after {
  animation-delay: 1.2s;
}
@keyframes sonar {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(2.6); opacity: 0; }
}
.zone-title {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.9rem);
  letter-spacing: 0.06em;
}
.zone-sub {
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.hint-enter-active,
.hint-leave-active,
.zone-enter-active,
.zone-leave-active {
  transition: opacity 0.8s var(--ease-out), filter 0.8s, transform 0.8s var(--ease-out);
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}
.zone-enter-from,
.zone-leave-to {
  opacity: 0;
  filter: blur(8px);
}
@media (max-width: 760px) {
  .card {
    flex-direction: column;
    border-radius: 18px;
    gap: 10px;
    bottom: calc(var(--row) * 6);
  }
}
</style>
