# Underwater

A real-time WebGL gallery on the sea floor. A guided route drifts through a sandy
canyon past five procedural sculptures, or you can leave the route and swim freely.
TypeScript + Vite + Vue 3 + Babylon.js, with every shader in its own `.glsl` file.

```bash
npm install
npm run dev        # http://localhost:5173 with HMR (Vue, TS and GLSL)
npm run build      # vue-tsc typecheck + production build
```

## What it is (and isn't)

This started as a study of how immersive Babylon.js sites such as canariasart.com are
put together. The study informed the *architecture and techniques* only: no code,
3D models, textures, audio or text from that site are included here. Every
asset is generated at runtime from code in this repo, and all copy is original.

Techniques observed in the reference and re-implemented independently:

| Technique | Where it lives here |
| --- | --- |
| HTML/CSS water-fill preloader shown before the bundle parses | `index.html`, `src/core/Preloader.ts` |
| Camera rail through the scene, driven by wheel / drag / touch with inertia | `src/controls/RouteController.ts` |
| Free swim mode with keyboard + mouse look, virtual joystick on touch | `src/controls/FreeSwimController.ts`, `src/controls/Input.ts` |
| Smooth blending between camera modes | `src/controls/CameraDirector.ts` |
| Custom water materials: caustics, depth fog, light absorption | `src/shaders/*.glsl`, `src/shaders/includes/*` |
| Light shafts and suspended dust | `src/scene/world/GodRays.ts`, `src/scene/world/MarineSnow.ts` |
| Depth of field, bloom, grain, vignette, water-ripple transitions | `src/effects/PostFX.ts`, `src/shaders/post/underwater.fragment.glsl` |
| Proximity "zone" indicator for exhibits in free mode | `src/scene/sculptures/SculptureGarden.ts`, `ImmersiveHint.vue` |
| Viewport CSS variables (`--vh`, `--row`) for responsive typography | `src/core/Device.ts` |

## Architecture

```
src/
  main.ts                 Vue bootstrap
  App.vue                 canvas + UI shell, section transitions
  core/
    Experience.ts         builds the world step by step, runs the frame loop,
                          applies section changes (the only 3D <-> UI bridge)
    store.ts              reactive app state + actions
    router.ts             hash routes: #/about, #/sculptures/2 …
    Device.ts             device detection, viewport CSS vars
    Preloader.ts          real build progress -> inline preloader
    noise.ts, math.ts     CPU noise (terrain/rocks) and helpers
  shaders/                isolated GLSL, registered with Babylon in shaders/index.ts
    includes/             uwNoise, uwCaustics, uwFog (#include<…>)
    post/                 full-screen underwater pass
  scene/
    palette.ts            art direction constants
    materials/            MaterialLibrary: ShaderMaterials + shared uniforms
    world/                Terrain (analytic canyon), Rocks, GodRays, Dome, MarineSnow
    sculptures/           figure/chair rig builders + the five pieces
    life/                 FishSchool (boids, thin instances), Manta
  controls/               Input, CameraDirector, Route/FreeSwim/Focus controllers
  effects/PostFX.ts       DefaultRenderingPipeline + custom post-process
  audio/AudioEngine.ts    synthesised soundscape (Web Audio, no files)
  content/                sculpture texts and UI copy
  ui/components/          TopNav, HeroTitle, panels, ControlsDock, CursorFx, joystick
```

### Shader hot reload

Editing any `.glsl` file triggers Vite HMR in `src/shaders/index.ts`. The new
sources are re-registered in Babylon's shader store, and `MaterialLibrary.rebuild()`
swaps the materials in place, so the camera and scene state survive.

### Controls

| | Desktop | Touch |
| --- | --- | --- |
| Entrance route | wheel, drag, ↑/↓ | vertical drag |
| Immersive | WASD / arrows, Space/Shift (or E/Q), drag to look | left-side stick, right-side drag |
| Sculpture view | drag to orbit, wheel to zoom | drag |
| Any mode | click a sculpture to open it | tap |

### Notes

- `@babylonjs/core` is excluded from Vite's dependency pre-bundling (see
  `vite.config.ts`). Babylon lazy-loads its own shaders with dynamic imports, and
  pre-bundling would give those chunks a separate shader store.
- Audio starts after the first user gesture (browser autoplay policy) and is muted
  by default. Use the speaker button to turn it on.
- Mobile devices get a lower render scale, fewer particles and fish, and a lighter
  post stack.
