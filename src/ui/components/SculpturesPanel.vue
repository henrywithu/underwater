<script setup lang="ts">
import { computed } from 'vue';
import { SCULPTURES } from '@/content/sculptures';
import { COPY } from '@/content/copy';
import { store } from '@/core/store';
import { navigate } from '@/core/router';
import { audio } from '@/audio/AudioEngine';

const active = computed(() => (store.activeSculpture !== null ? SCULPTURES[store.activeSculpture] : null));
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function open(i: number | null) {
  audio.select();
  navigate('sculptures', i);
}
function step(d: number) {
  const n = SCULPTURES.length;
  open((((store.activeSculpture ?? 0) + d) % n + n) % n);
}
</script>

<template>
  <div class="sculptures">
    <Transition name="swap" mode="out-in">
      <!-- index: list of pieces -->
      <section v-if="!active" key="list" class="list">
        <h2 class="heading">{{ COPY.sculptures.heading }}</h2>
        <ol>
          <li v-for="(s, i) in SCULPTURES" :key="s.id" :style="{ '--d': `${0.15 + i * 0.09}s` }">
            <button class="item" @mouseenter="audio.hover()" @click="open(i)">
              <span class="num">{{ roman[i] }}</span>
              <span class="text">
                <span class="title">{{ s.title }}</span>
                <span class="sub">{{ s.subtitle }}</span>
              </span>
              <span class="arrow" aria-hidden="true">→</span>
            </button>
          </li>
        </ol>
      </section>

      <!-- detail: the camera orbits the piece while its text is shown -->
      <section v-else :key="active.id" class="detail">
        <button class="back" @click="open(null)">← {{ COPY.sculptures.back }}</button>
        <span class="num big">{{ roman[store.activeSculpture!] }}</span>
        <h2 class="title-big">{{ active.title }}</h2>
        <p class="sub">{{ active.subtitle }}</p>
        <div class="desc uw-scroll">
          <p v-for="(p, i) in active.text" :key="i">{{ p }}</p>
        </div>
        <div class="pager">
          <button aria-label="Previous sculpture" @click="step(-1)">‹</button>
          <span>{{ store.activeSculpture! + 1 }} / {{ SCULPTURES.length }}</span>
          <button aria-label="Next sculpture" @click="step(1)">›</button>
        </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.sculptures {
  position: absolute;
  top: calc(var(--row) * 4.2);
  bottom: calc(var(--row) * 3.2);
  left: var(--gutter);
  width: min(480px, calc(100vw - 2 * var(--gutter)));
  pointer-events: auto;
}
.heading,
.title-big {
  margin: 0 0 calc(var(--row) * 1);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.5rem, 2.6vw, 2.5rem);
  letter-spacing: 0.06em;
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  animation: rise 0.9s var(--ease-out) both;
  animation-delay: var(--d);
}
.item {
  width: 100%;
  display: grid;
  grid-template-columns: 3.2em 1fr auto;
  align-items: center;
  text-align: left;
  padding: calc(var(--row) * 0.7) 0;
  border-bottom: 1px solid var(--panel-edge);
  transition: padding 0.5s var(--ease-out), background 0.5s;
}
.item:hover {
  padding-left: 12px;
  background: linear-gradient(90deg, #5ad2f61a, transparent);
}
.num {
  font-family: var(--font-display);
  color: var(--accent);
  letter-spacing: 0.1em;
}
.num.big {
  font-size: 1.2rem;
}
.text {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}
.title {
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 1.6vw, 1.4rem);
}
.sub {
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin: 0;
}
.arrow {
  opacity: 0;
  transform: translateX(-8px);
  transition: 0.4s var(--ease-out);
  color: var(--accent);
}
.item:hover .arrow {
  opacity: 1;
  transform: none;
}
.detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  text-shadow: 0 1px 8px #00142a;
}
.back {
  align-self: flex-start;
  font-size: 0.76rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-dim);
  margin-bottom: calc(var(--row) * 1.2);
  transition: color 0.3s;
}
.back:hover {
  color: var(--ink);
}
.title-big {
  margin-top: 0.2em;
  margin-bottom: 0.3em;
}
.desc {
  margin-top: calc(var(--row) * 1.2);
  min-height: 0;
  flex: 0 1 auto;
}
.desc p {
  font-size: clamp(1rem, 1.3vw, 1.2rem);
  line-height: 1.5;
  font-weight: 300;
  margin: 0 0 1em;
}
.pager {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--ink-dim);
}
.pager button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--panel-edge);
  border-radius: 50%;
  font-size: 1.3rem;
  transition: border-color 0.3s, background 0.3s;
}
.pager button:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out), filter 0.6s;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(6px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-12px);
  filter: blur(6px);
}
@keyframes rise {
  from { opacity: 0; transform: translateX(-16px); }
}
@media (max-width: 760px) {
  .sculptures {
    top: auto;
    bottom: calc(env(safe-area-inset-bottom) + 72px);
    max-height: 52vh;
    padding: 18px;
    background: var(--panel);
    backdrop-filter: blur(10px);
    border: 1px solid var(--panel-edge);
    border-radius: 16px;
    overflow-y: auto;
  }
  .detail {
    height: auto;
  }
  .pager {
    margin-top: 12px;
  }
}
</style>
