<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useExperience } from '@/core/experienceContext';

/** Visual for the virtual stick; the actual input lives in controls/Input.ts. */
const exp = useExperience();
const state = ref({ active: false, ox: 0, oy: 0, x: 0, y: 0 });
let raf = 0;

function tick() {
  const j = exp.value?.input?.joystick;
  if (j) state.value = { active: j.active, ox: j.originX, oy: j.originY, x: j.x, y: j.y };
  raf = requestAnimationFrame(tick);
}
onMounted(() => (raf = requestAnimationFrame(tick)));
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>
  <div class="joy-zone" aria-hidden="true">
    <div v-if="!state.active" class="ghost">
      <span class="knob" />
    </div>
    <div v-else class="stick" :style="{ left: `${state.ox}px`, top: `${state.oy}px` }">
      <span class="knob" :style="{ transform: `translate(${state.x * 40}px, ${state.y * 40}px)` }" />
    </div>
  </div>
</template>

<style scoped>
.joy-zone {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ghost,
.stick {
  position: absolute;
  width: 112px;
  height: 112px;
  margin: -56px 0 0 -56px;
  border-radius: 50%;
  border: 1px solid #a7d3e666;
  background: radial-gradient(circle, #5ad2f61a, transparent 70%);
  display: grid;
  place-items: center;
}
.ghost {
  left: 90px;
  bottom: calc(80px + env(safe-area-inset-bottom));
  top: auto;
  margin: 0 0 0 -56px;
  opacity: 0.55;
  animation: breathe 2.6s ease-in-out infinite;
}
.knob {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #d6fbffcc, #5ad2f666);
  box-shadow: 0 0 14px #5ad2f655;
}
@keyframes breathe {
  50% { transform: scale(1.06); opacity: 0.8; }
}
</style>
