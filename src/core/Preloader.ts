import { watch } from 'vue';
import { actions, store } from './store';

interface LoaderState { shown: number; target: number; running: boolean }

const loader = () => (window as unknown as { __underwaterLoader?: LoaderState }).__underwaterLoader;

/**
 * Bridges real build progress (store.loading) into the inline preloader from
 * index.html. The bundle download is roughly the first 10%, scene construction and
 * shader compilation the rest.
 */
export function trackPreloader() {
  return watch(
    () => store.loading,
    (v) => {
      const l = loader();
      if (l) l.target = Math.max(l.target, 10 + v * 89);
    },
    { immediate: true },
  );
}

/** Fill to 100%, let the orb settle, then fade it out and reveal the scene. */
export function finishPreloader(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.getElementById('preloader');
    const l = loader();
    if (!el || !l) {
      actions.setReady();
      return resolve();
    }
    l.target = 100;
    const wait = () => {
      if (l.shown < 99.5) return requestAnimationFrame(wait);
      setTimeout(() => {
        l.running = false;
        el.classList.add('is-done');
        actions.setReady();
        setTimeout(() => el.remove(), 1000);
        resolve();
      }, 250);
    };
    wait();
  });
}
