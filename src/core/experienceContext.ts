import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue';
import type { Experience } from './Experience';

const KEY: InjectionKey<ShallowRef<Experience | null>> = Symbol('experience');

export function provideExperience() {
  const ref = shallowRef<Experience | null>(null);
  provide(KEY, ref);
  return ref;
}

export function useExperience() {
  const ref = inject(KEY);
  if (!ref) throw new Error('Experience not provided');
  return ref;
}
