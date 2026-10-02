<script setup lang="ts">
import GlassPanel from './GlassPanel.vue';
import { COPY } from '@/content/copy';
</script>

<template>
  <GlassPanel :heading="COPY.about.heading">
    <div class="cols">
      <div v-for="(col, ci) in COPY.about.columns" :key="ci" class="col" :style="{ '--d': `${0.25 + ci * 0.2}s` }">
        <p v-for="(p, pi) in col" :key="pi">{{ p }}</p>
      </div>
    </div>
  </GlassPanel>
</template>

<style scoped>
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(24px, 5vw, 90px);
}
.col {
  animation: rise 1.2s var(--ease-out) both;
  animation-delay: var(--d);
}
.col:last-child {
  border-right: 2px solid #5ad2f666;
  padding-right: 1.2rem;
}
p {
  margin: 0 0 1em;
  font-size: clamp(1rem, 1.55vw, 1.5rem);
  line-height: 1.38;
  font-weight: 300;
  color: var(--ink);
  text-shadow: 0 1px 6px #00142a;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(24px); filter: blur(6px); }
}
@media (max-width: 760px) {
  .cols {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .col:last-child {
    border-right: 0;
    padding-right: 0;
  }
}
</style>
