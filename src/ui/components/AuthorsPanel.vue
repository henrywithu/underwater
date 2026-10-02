<script setup lang="ts">
import GlassPanel from './GlassPanel.vue';
import { COPY } from '@/content/copy';
</script>

<template>
  <GlassPanel :heading="COPY.authors.heading">
    <ul class="credits">
      <li v-for="(c, i) in COPY.authors.credits" :key="c.role" :style="{ '--d': `${0.2 + i * 0.12}s` }">
        <span class="role">{{ c.role }}</span>
        <span class="name">{{ c.name }}</span>
      </li>
    </ul>
    <p class="note">{{ COPY.authors.note }}</p>
  </GlassPanel>
</template>

<style scoped>
.credits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: calc(var(--row) * 1.2) 4vw;
}
li {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  padding: 1.1em 0 0;
  border-top: 1px solid var(--panel-edge);
  animation: rise 1s var(--ease-out) both;
  animation-delay: var(--d);
}
.role {
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.name {
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 1.8vw, 1.7rem);
}
.note {
  margin-top: calc(var(--row) * 2.4);
  font-weight: 300;
  color: var(--ink-dim);
  font-size: 1rem;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
}
</style>
