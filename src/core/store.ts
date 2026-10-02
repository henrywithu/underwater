import { reactive, readonly } from 'vue';

export type SectionId = 'entrance' | 'about' | 'immersive' | 'sculptures' | 'authors';
export type CameraMode = 'route' | 'free' | 'focus';

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'entrance', label: 'Entrance' },
  { id: 'about', label: 'About' },
  { id: 'immersive', label: 'Immersive' },
  { id: 'sculptures', label: 'Sculptures' },
  { id: 'authors', label: 'Authors' },
];

interface AppState {
  section: SectionId;
  loading: number; // 0..1 real build progress
  ready: boolean;
  muted: boolean;
  fullscreen: boolean;
  cameraMode: CameraMode;
  routeProgress: number; // 0..1 along the guided path
  activeSculpture: number | null;
  nearSculpture: number | null; // sculpture zone the free-swim camera is inside
  showControlsHint: boolean;
  menuOpen: boolean; // mobile nav
}

const state = reactive<AppState>({
  section: 'entrance',
  loading: 0,
  ready: false,
  muted: true,
  fullscreen: false,
  cameraMode: 'route',
  routeProgress: 0,
  activeSculpture: null,
  nearSculpture: null,
  showControlsHint: false,
  menuOpen: false,
});

/** Single reactive source of truth. Mutations go through `actions` so they are traceable. */
export const store = readonly(state);

export const actions = {
  setLoading(v: number) {
    state.loading = Math.max(state.loading, Math.min(1, v));
  },
  setReady() {
    state.ready = true;
  },
  setSection(id: SectionId) {
    state.section = id;
    state.menuOpen = false;
  },
  setMuted(v: boolean) {
    state.muted = v;
  },
  setFullscreen(v: boolean) {
    state.fullscreen = v;
  },
  setCameraMode(m: CameraMode) {
    state.cameraMode = m;
  },
  setRouteProgress(v: number) {
    state.routeProgress = v;
  },
  setActiveSculpture(i: number | null) {
    state.activeSculpture = i;
  },
  setNearSculpture(i: number | null) {
    if (state.nearSculpture !== i) state.nearSculpture = i;
  },
  setControlsHint(v: boolean) {
    state.showControlsHint = v;
  },
  toggleMenu(v?: boolean) {
    state.menuOpen = v ?? !state.menuOpen;
  },
};
