<script setup lang="ts">
defineProps<{ heading: string; wide?: boolean }>();
</script>

<template>
  <section class="panel" :class="{ wide }">
    <h2 class="heading">{{ heading }}</h2>
    <div class="body uw-scroll">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel {
  position: absolute;
  top: calc(var(--row) * 4.2);
  bottom: calc(var(--row) * 3.2);
  left: var(--gutter);
  right: var(--gutter);
  margin: 0 auto;
  max-width: 1180px;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}
.heading {
  margin: 0 0 calc(var(--row) * 1) 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.6vw, 2.5rem);
  letter-spacing: 0.06em;
  padding-bottom: 0.3em;
  position: relative;
  align-self: flex-start;
}
.heading::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 140%;
  height: 1px;
  background: linear-gradient(90deg, var(--ink), transparent);
  animation: line 1.2s 0.3s var(--ease-out) both;
  transform-origin: left;
}
@keyframes line {
  from { transform: scaleX(0); }
}
.body {
  flex: 1;
  min-height: 0;
  padding-right: 1.2rem;
  /* text fades out at the bottom edge while scrolling */
  mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent);
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent);
  padding-bottom: 60px;
}
</style>
