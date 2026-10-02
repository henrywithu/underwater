<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Mouse effect: a soft ring cursor that lags behind the pointer with spring physics,
 * grows over interactive elements, and sheds small bubbles that wobble upward while
 * the mouse moves. Disabled on touch devices.
 */
const canvas = ref<HTMLCanvasElement>();
const ring = ref<HTMLDivElement>();
const dot = ref<HTMLDivElement>();
const enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

interface Bubble { x: number; y: number; r: number; vy: number; life: number; max: number; phase: number }

let raf = 0;
const bubbles: Bubble[] = [];
const m = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2 };
const r = { x: m.x, y: m.y, vx: 0, vy: 0, scale: 1, scaleT: 1, down: 0 };
let carry = 0;
let visible = false;

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;
  m.x = e.clientX;
  m.y = e.clientY;
  visible = true;
  const t = e.target as HTMLElement | null;
  r.scaleT = t?.closest('button, a, [role="button"]') ? 1.9 : 1;
}
const onDown = () => (r.down = 1);
const onLeave = () => (visible = false);

function frame() {
  const c = canvas.value!;
  const ctx = c.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio, 2);
  if (c.width !== innerWidth * dpr || c.height !== innerHeight * dpr) {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
  }
  // critically-damped-ish spring for the ring
  const k = 0.16, d = 0.72;
  r.vx = (r.vx + (m.x - r.x) * k) * d;
  r.vy = (r.vy + (m.y - r.y) * k) * d;
  r.x += r.vx;
  r.y += r.vy;
  r.scale += (r.scaleT - r.scale) * 0.15;
  r.down *= 0.88;
  const stretch = Math.min(0.35, Math.hypot(r.vx, r.vy) / 60);
  const angle = Math.atan2(r.vy, r.vx);
  if (ring.value) {
    ring.value.style.transform = `translate(${r.x}px, ${r.y}px) rotate(${angle}rad) scale(${r.scale * (1 + stretch) * (1 - r.down * 0.25)}, ${r.scale * (1 - stretch * 0.6) * (1 - r.down * 0.25)})`;
    ring.value.style.opacity = visible ? '1' : '0';
  }
  if (dot.value) {
    dot.value.style.transform = `translate(${m.x}px, ${m.y}px)`;
    dot.value.style.opacity = visible ? '1' : '0';
  }

  // emit bubbles proportional to mouse travel
  const travel = Math.hypot(m.x - m.px, m.y - m.py);
  carry += travel * 0.06;
  while (carry > 1 && bubbles.length < 120) {
    carry -= 1;
    const max = 60 + Math.random() * 60;
    bubbles.push({
      x: m.x + (Math.random() - 0.5) * 10, y: m.y + (Math.random() - 0.5) * 10,
      r: 1 + Math.random() * 3.2, vy: 0.4 + Math.random() * 0.8, life: 0, max, phase: Math.random() * 6.28,
    });
  }
  carry = Math.min(carry, 3);
  m.px = m.x;
  m.py = m.y;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life++;
    b.y -= b.vy;
    b.vy *= 1.01;
    b.x += Math.sin(b.life * 0.12 + b.phase) * 0.35;
    const t = b.life / b.max;
    if (t >= 1) { bubbles.splice(i, 1); continue; }
    const a = Math.sin(Math.PI * t) * 0.7;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(190, 240, 255, ${a})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // specular glint
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
    ctx.fill();
  }
  raf = requestAnimationFrame(frame);
}

onMounted(() => {
  if (!enabled) return;
  document.documentElement.classList.add('uw-has-cursor');
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onDown);
  document.addEventListener('mouseleave', onLeave);
  raf = requestAnimationFrame(frame);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  document.documentElement.classList.remove('uw-has-cursor');
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerdown', onDown);
  document.removeEventListener('mouseleave', onLeave);
});
</script>

<template>
  <div v-if="enabled" class="cursor-fx" aria-hidden="true">
    <canvas ref="canvas" class="bubbles" />
    <div ref="ring" class="ring" />
    <div ref="dot" class="dot" />
  </div>
</template>

<style scoped>
.cursor-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 900;
}
.bubbles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ring,
.dot {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  transition: opacity 0.3s;
  will-change: transform;
}
.ring {
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border: 1px solid #c9f3ffcc;
  box-shadow: 0 0 12px #5ad2f655, inset 0 0 8px #5ad2f633;
}
.dot {
  width: 4px;
  height: 4px;
  margin: -2px 0 0 -2px;
  background: #fff;
  box-shadow: 0 0 6px #5ad2f6;
}
</style>
