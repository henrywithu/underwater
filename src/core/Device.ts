import { ref } from 'vue';

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export const device = {
  isTouch: coarse || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && coarse),
  isMobile: coarse && Math.min(window.innerWidth, window.innerHeight) < 820,
  /** Lower render scale on small/high-dpr devices so the fill-rate heavy post stack stays smooth. */
  get renderScale() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return this.isMobile ? Math.min(dpr, 1.5) : dpr;
  },
};

export const isLandscape = ref(window.innerWidth > window.innerHeight);

/**
 * Publishes viewport-derived CSS custom properties. `--vh` fixes the mobile 100vh
 * address-bar problem; `--row` is a vertical rhythm unit (1/42 of the viewport height)
 * that the UI typography and spacing scale from, so the layout keeps its proportions
 * from ultrawide monitors down to phones.
 */
export function publishViewportVars() {
  const root = document.documentElement.style;
  const h = window.innerHeight;
  const w = window.innerWidth;
  isLandscape.value = w > h;
  root.setProperty('--vh', `${h * 0.01}px`);
  const rowScale = device.isMobile && isLandscape.value ? 2 : 1;
  root.setProperty('--row', `${(h / 42) * rowScale}px`);
}

export function watchViewport() {
  publishViewportVars();
  window.addEventListener('resize', publishViewportVars);
  window.addEventListener('orientationchange', () => setTimeout(publishViewportVars, 250));
}
