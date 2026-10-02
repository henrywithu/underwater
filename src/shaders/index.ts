import { Effect } from '@babylonjs/core/Materials/effect';

import uwNoise from './includes/uwNoise.glsl?raw';
import uwCaustics from './includes/uwCaustics.glsl?raw';
import uwFog from './includes/uwFog.glsl?raw';

import seabedVertex from './seabed.vertex.glsl?raw';
import seabedFragment from './seabed.fragment.glsl?raw';
import rockVertex from './rock.vertex.glsl?raw';
import rockFragment from './rock.fragment.glsl?raw';
import sculptureVertex from './sculpture.vertex.glsl?raw';
import sculptureFragment from './sculpture.fragment.glsl?raw';
import fishVertex from './fish.vertex.glsl?raw';
import fishFragment from './fish.fragment.glsl?raw';
import mantaVertex from './manta.vertex.glsl?raw';
import mantaFragment from './manta.fragment.glsl?raw';
import godraysVertex from './godrays.vertex.glsl?raw';
import godraysFragment from './godrays.fragment.glsl?raw';
import domeVertex from './dome.vertex.glsl?raw';
import domeFragment from './dome.fragment.glsl?raw';
import underwaterPost from './post/underwater.fragment.glsl?raw';

/** Shader program names, used as the `shaderPath` of ShaderMaterial / PostProcess. */
export const SHADERS = {
  seabed: 'uwSeabed',
  rock: 'uwRock',
  sculpture: 'uwSculpture',
  fish: 'uwFish',
  manta: 'uwManta',
  godrays: 'uwGodrays',
  dome: 'uwDome',
  underwaterPost: 'uwUnderwaterPost',
} as const;

/**
 * Registers every .glsl file with Babylon's shader stores. Includes become available as
 * `#include<uwNoise>` etc. Called once at boot, and again by HMR when a shader changes.
 */
export function registerShaders() {
  Effect.IncludesShadersStore.uwNoise = uwNoise;
  Effect.IncludesShadersStore.uwCaustics = uwCaustics;
  Effect.IncludesShadersStore.uwFog = uwFog;

  const programs: [string, string, string][] = [
    [SHADERS.seabed, seabedVertex, seabedFragment],
    [SHADERS.rock, rockVertex, rockFragment],
    [SHADERS.sculpture, sculptureVertex, sculptureFragment],
    [SHADERS.fish, fishVertex, fishFragment],
    [SHADERS.manta, mantaVertex, mantaFragment],
    [SHADERS.godrays, godraysVertex, godraysFragment],
    [SHADERS.dome, domeVertex, domeFragment],
  ];
  for (const [name, vs, fs] of programs) {
    Effect.ShadersStore[`${name}VertexShader`] = vs;
    Effect.ShadersStore[`${name}FragmentShader`] = fs;
  }
  Effect.ShadersStore[`${SHADERS.underwaterPost}FragmentShader`] = underwaterPost;
}

// Shader HMR: when any .glsl file changes, Vite re-executes this module; we re-register
// the sources and ask the running experience to rebuild its materials in place
// instead of reloading the page and losing the camera position.
if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    (mod as typeof import('./index') | undefined)?.registerShaders();
    window.dispatchEvent(new CustomEvent('underwater:shaders-updated'));
  });
}
