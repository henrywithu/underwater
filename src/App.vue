<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Experience } from '@/core/Experience';
import { provideExperience } from '@/core/experienceContext';
import { startRouter } from '@/core/router';
import { store } from '@/core/store';
import { device } from '@/core/Device';
import { finishPreloader, trackPreloader } from '@/core/Preloader';
import { audio } from '@/audio/AudioEngine';

import TopNav from '@/ui/components/TopNav.vue';
import HeroTitle from '@/ui/components/HeroTitle.vue';
import AboutPanel from '@/ui/components/AboutPanel.vue';
import AuthorsPanel from '@/ui/components/AuthorsPanel.vue';
import SculpturesPanel from '@/ui/components/SculpturesPanel.vue';
import ImmersiveHint from '@/ui/components/ImmersiveHint.vue';
import ControlsDock from '@/ui/components/ControlsDock.vue';
import CursorFx from '@/ui/components/CursorFx.vue';
import TouchJoystick from '@/ui/components/TouchJoystick.vue';

const canvas = ref<HTMLCanvasElement>();
const experience = provideExperience();
let stopRouter: (() => void) | null = null;

onMounted(async () => {
  const exp = new Experience(canvas.value!);
  experience.value = exp;
  if (import.meta.env.DEV) (window as unknown as { __uw: Experience }).__uw = exp;
  const untrack = trackPreloader();
  await exp.init();
  untrack();
  await finishPreloader();

  stopRouter = startRouter((section, sculpture) => {
    exp.goToSection(section);
    if (section === 'sculptures') exp.showSculpture(sculpture);
  });

  // audio may only start after a user gesture
  const unlock = () => {
    audio.start().then(() => audio.setMuted(store.muted));
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
});

onBeforeUnmount(() => {
  stopRouter?.();
  experience.value?.dispose();
});

// dim the 3D view a little behind text-heavy panels for legibility
const veil = ref(0);
watch(
  () => store.section,
  (s) => (veil.value = s === 'about' || s === 'authors' ? 1 : s === 'sculptures' ? 0.5 : 0),
  { immediate: true },
);
</script>

<template>
  <main class="app" :class="[`section-${store.section}`, { ready: store.ready }]">
    <canvas ref="canvas" class="scene" touch-action="none" />
    <div class="veil" :style="{ opacity: veil }" />

    <div v-if="store.ready" class="ui">
      <TopNav />
      <Transition name="section" mode="out-in">
        <HeroTitle v-if="store.section === 'entrance'" key="entrance" />
        <AboutPanel v-else-if="store.section === 'about'" key="about" />
        <ImmersiveHint v-else-if="store.section === 'immersive'" key="immersive" />
        <SculpturesPanel v-else-if="store.section === 'sculptures'" key="sculptures" />
        <AuthorsPanel v-else-if="store.section === 'authors'" key="authors" />
      </Transition>
      <TouchJoystick v-if="device.isTouch && store.cameraMode === 'free'" />
      <ControlsDock />
    </div>
    <CursorFx />
  </main>
</template>

<style scoped>
.app {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}
.veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, #02122688 0%, #02122655 60%, #02122633 100%);
  transition: opacity 1.2s var(--ease-water);
}
.ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  animation: ui-in 1.6s 0.2s var(--ease-out) both;
}
.ui :deep(button) {
  pointer-events: auto;
}
@keyframes ui-in {
  from { opacity: 0; }
}
.section-enter-active,
.section-leave-active {
  transition: opacity 0.7s var(--ease-water), filter 0.7s var(--ease-water);
}
.section-enter-from,
.section-leave-to {
  opacity: 0;
  filter: blur(8px);
}
</style>
