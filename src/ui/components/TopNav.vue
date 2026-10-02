<script setup lang="ts">
import { SECTIONS, actions, store, type SectionId } from '@/core/store';
import { navigate } from '@/core/router';
import { audio } from '@/audio/AudioEngine';

function go(id: SectionId) {
  audio.select();
  navigate(id);
}
</script>

<template>
  <header class="nav" :class="{ open: store.menuOpen }">
    <button class="burger" :aria-expanded="store.menuOpen" aria-label="Menu" @click="actions.toggleMenu()">
      <span /><span /><span />
    </button>
    <nav class="links" aria-label="Sections">
      <button
        v-for="(s, i) in SECTIONS"
        :key="s.id"
        class="link"
        :class="{ active: store.section === s.id }"
        :style="{ '--i': i }"
        @mouseenter="audio.hover()"
        @click="go(s.id)"
      >
        <span class="label">{{ s.label }}</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: calc(var(--row) * 0.9) var(--gutter) 0;
  pointer-events: none;
}
.links {
  display: flex;
  justify-content: space-between;
  pointer-events: auto;
}
.link {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(0.8rem, 1.45vw, 1.35rem);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-dim);
  padding: 0.4em 0;
  transition: color 0.4s var(--ease-out), text-shadow 0.4s;
}
.link:hover,
.link.active {
  color: var(--ink);
  text-shadow: 0 0 14px #5ad2f688;
}
/* underline grows from the centre like a ripple */
.link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0.22em;
  bottom: 0.15em;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transition: transform 0.6s var(--ease-out);
}
.link:hover::after {
  transform: scaleX(0.5);
}
.link.active::after {
  transform: scaleX(1);
}
.burger {
  display: none;
  pointer-events: auto;
}

@media (max-width: 760px) {
  .nav {
    padding-top: calc(env(safe-area-inset-top) + 14px);
  }
  .burger {
    display: grid;
    gap: 6px;
    width: 44px;
    height: 44px;
    place-content: center;
    margin-left: auto;
    position: relative;
    z-index: 2;
  }
  .burger span {
    display: block;
    width: 24px;
    height: 1px;
    background: var(--ink);
    transition: transform 0.4s var(--ease-out), opacity 0.3s;
  }
  .open .burger span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .open .burger span:nth-child(2) {
    opacity: 0;
  }
  .open .burger span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }
  .links {
    position: fixed;
    inset: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3.5vh;
    background: radial-gradient(circle at 50% 30%, #0b3a5ee6, #020f20f2);
    backdrop-filter: blur(6px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s var(--ease-out), visibility 0.5s;
  }
  .open .links {
    opacity: 1;
    visibility: visible;
  }
  .link {
    font-size: 1.3rem;
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 0.5s, transform 0.6s var(--ease-out), color 0.3s;
    transition-delay: calc(var(--i) * 60ms);
  }
  .open .link {
    opacity: 1;
    transform: none;
  }
}
</style>
