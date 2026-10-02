<script setup lang="ts">
import { computed } from 'vue';
import { store } from '@/core/store';
import { COPY } from '@/content/copy';

// the title floats away as the visitor descends the route
const fade = computed(() => Math.max(0, 1 - store.routeProgress / 0.05));
const letters = COPY.title.split('');
</script>

<template>
  <div class="hero" :style="{ opacity: fade, transform: `translate(-50%, calc(-50% - ${(1 - fade) * 40}px))` }">
    <h1 class="title" :aria-label="COPY.title">
      <span v-for="(l, i) in letters" :key="i" class="ch" :style="{ '--i': i }" aria-hidden="true">{{ l }}</span>
    </h1>
    <p class="subtitle">{{ COPY.subtitle }}</p>
    <div class="hint" :style="{ opacity: fade }">
      <span class="mouse"><span class="wheel" /></span>
      {{ COPY.scrollHint }}
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: absolute;
  left: 50%;
  top: 48%;
  text-align: center;
  pointer-events: none;
  width: min(92vw, 900px);
}
.title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.2rem, 6.2vw, 5.8rem);
  letter-spacing: 0.08em;
  color: var(--ink);
  text-shadow: 0 0 30px #5ad2f655, 0 2px 4px #00122a;
}
/* each letter surfaces from below, blurred like through moving water */
.ch {
  display: inline-block;
  animation: surface 1.8s var(--ease-out) both;
  animation-delay: calc(0.4s + var(--i) * 0.08s);
}
@keyframes surface {
  from {
    opacity: 0;
    filter: blur(10px);
    transform: translateY(0.4em) scaleY(1.3);
  }
}
.subtitle {
  margin: 0.8em auto 0;
  padding-top: 0.8em;
  border-top: 1px solid #eaf8ff55;
  display: inline-block;
  font-family: var(--font-display);
  font-size: clamp(0.7rem, 1.25vw, 1.05rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-dim);
  animation: fade-in 2s 1.4s both;
}
.hint {
  margin-top: 9vh;
  font-size: 0.78rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-dim);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: fade-in 2s 2.4s both;
}
.mouse {
  width: 22px;
  height: 34px;
  border: 1px solid var(--ink-dim);
  border-radius: 12px;
  position: relative;
}
.wheel {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 2px;
  height: 6px;
  margin-left: -1px;
  background: var(--ink);
  border-radius: 1px;
  animation: scroll 1.8s ease-in-out infinite;
}
@keyframes scroll {
  0% { transform: translateY(0); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(12px); opacity: 0; }
}
@keyframes fade-in {
  from { opacity: 0; }
}
</style>
