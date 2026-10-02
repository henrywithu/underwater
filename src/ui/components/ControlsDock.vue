<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { actions, store } from '@/core/store';
import { audio } from '@/audio/AudioEngine';

async function toggleSound() {
  await audio.start();
  const muted = !store.muted;
  actions.setMuted(muted);
  audio.setMuted(muted);
  audio.select();
}

function toggleFullscreen() {
  audio.select();
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
const syncFs = () => actions.setFullscreen(Boolean(document.fullscreenElement));
onMounted(() => document.addEventListener('fullscreenchange', syncFs));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFs));
const canFullscreen = typeof document.documentElement.requestFullscreen === 'function';
</script>

<template>
  <div class="dock">
    <button v-if="canFullscreen" class="btn" :aria-label="store.fullscreen ? 'Exit fullscreen' : 'Fullscreen'" @mouseenter="audio.hover()" @click="toggleFullscreen">
      <svg v-if="!store.fullscreen" viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>
      <svg v-else viewBox="0 0 24 24"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /></svg>
    </button>
    <button class="btn" :class="{ on: !store.muted }" :aria-label="store.muted ? 'Sound on' : 'Sound off'" @mouseenter="audio.hover()" @click="toggleSound">
      <svg viewBox="0 0 24 24">
        <path class="fill" d="M4 9h4l5-4v14l-5-4H4z" />
        <template v-if="!store.muted">
          <path class="wave w1" d="M16 9.5a3.5 3.5 0 0 1 0 5" />
          <path class="wave w2" d="M18.5 7a7 7 0 0 1 0 10" />
        </template>
        <path v-else d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.dock {
  position: absolute;
  right: var(--gutter);
  bottom: calc(var(--row) * 1 + env(safe-area-inset-bottom));
  display: flex;
  gap: 12px;
  z-index: 20;
}
.btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid #a7d3e666;
  background: radial-gradient(circle at 35% 30%, #5ad2f633, #02142a55);
  backdrop-filter: blur(4px);
  transition: border-color 0.3s, box-shadow 0.4s, transform 0.3s var(--ease-out);
}
.btn:hover {
  border-color: var(--accent);
  box-shadow: 0 0 16px #5ad2f655;
  transform: translateY(-2px);
}
.btn.on {
  border-color: var(--accent);
}
svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fill {
  fill: var(--ink);
  stroke: none;
}
.wave {
  animation: pulse 1.6s ease-in-out infinite;
}
.w2 {
  animation-delay: 0.3s;
}
@keyframes pulse {
  50% { opacity: 0.35; }
}
</style>
