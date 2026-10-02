import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3 } from '@babylonjs/core/Maths/math.color';

import { SHADERS } from '@/shaders';
import { PALETTE, FOG_DENSITY } from '../palette';

const FOG_UNIFORMS = ['uFogNear', 'uFogDeep', 'uFogDensity', 'uCameraPos'];
const COMMON_UNIFORMS = ['world', 'viewProjection', 'uTime', 'uSunDir', ...FOG_UNIFORMS];

type Recipe = {
  shader: string;
  uniforms: string[];
  attributes?: string[];
  setup?: (m: ShaderMaterial) => void;
  alpha?: boolean;
  backFace?: boolean;
};

/**
 * Creates and owns every ShaderMaterial in the scene. All materials share the same
 * fog / time / camera uniforms, which are pushed once per frame in `update()`.
 * Materials can be rebuilt in place (shader HMR) because meshes only keep a handle
 * obtained through `get()` and we swap `mesh.material` on rebuild.
 */
export class MaterialLibrary {
  private materials = new Map<string, ShaderMaterial>();
  private recipes = new Map<string, Recipe>();
  private time = 0;
  causticStrength = 1;
  fogDensity = FOG_DENSITY;

  constructor(private scene: Scene) {}

  define(key: string, recipe: Recipe): ShaderMaterial {
    this.recipes.set(key, recipe);
    const m = this.build(key, recipe);
    this.materials.set(key, m);
    return m;
  }

  get(key: string): ShaderMaterial {
    const m = this.materials.get(key);
    if (!m) throw new Error(`Material "${key}" not defined`);
    return m;
  }

  private build(key: string, r: Recipe): ShaderMaterial {
    const m = new ShaderMaterial(key, this.scene, r.shader, {
      attributes: r.attributes ?? ['position', 'normal', 'uv'],
      uniforms: [...COMMON_UNIFORMS, ...r.uniforms],
    });
    m.setColor3('uFogNear', PALETTE.fogNear);
    m.setColor3('uFogDeep', PALETTE.fogDeep);
    m.setVector3('uSunDir', PALETTE.sunDir);
    if (r.alpha) {
      m.alphaMode = Constants.ALPHA_ADD;
      m.needAlphaBlending = () => true;
      m.disableDepthWrite = true;
    }
    if (r.backFace) m.backFaceCulling = false;
    r.setup?.(m);
    return m;
  }

  /** Rebuild all materials (after shader sources changed) and re-assign them to meshes. */
  rebuild() {
    for (const [key, recipe] of this.recipes) {
      const old = this.materials.get(key)!;
      const fresh = this.build(key, recipe);
      for (const mesh of this.scene.meshes) if (mesh.material === old) mesh.material = fresh;
      this.materials.set(key, fresh);
      old.dispose(true, false);
    }
  }

  update(dt: number, camera: Camera) {
    this.time += dt;
    const pos = camera.globalPosition;
    for (const m of this.materials.values()) {
      m.setFloat('uTime', this.time);
      m.setVector3('uCameraPos', pos);
      m.setFloat('uFogDensity', this.fogDensity);
      m.setFloat('uCausticStrength', this.causticStrength);
    }
  }

  get elapsed() {
    return this.time;
  }

  /** Registers the standard set of underwater materials. */
  static createDefault(scene: Scene): MaterialLibrary {
    const lib = new MaterialLibrary(scene);
    lib.define('seabed', {
      shader: SHADERS.seabed,
      uniforms: ['uSandColor', 'uSandDark', 'uCausticStrength'],
      setup: (m) => {
        m.setColor3('uSandColor', PALETTE.sand);
        m.setColor3('uSandDark', PALETTE.sandDark);
      },
    });
    lib.define('rock', {
      shader: SHADERS.rock,
      attributes: ['position', 'normal'],
      uniforms: ['uRockColor', 'uAlgaeColor', 'uCausticStrength'],
      setup: (m) => {
        m.setColor3('uRockColor', PALETTE.rock);
        m.setColor3('uAlgaeColor', PALETTE.algae);
      },
    });
    const sculpture = (glow: number) => (m: ShaderMaterial) => {
      m.setColor3('uStoneColor', PALETTE.stone);
      m.setColor3('uMossColor', PALETTE.moss);
      m.setColor3('uGlowColor', PALETTE.glow);
      m.setFloat('uGlow', glow);
      m.setFloat('uHighlight', 0);
    };
    const sculptureUniforms = ['uStoneColor', 'uMossColor', 'uGlowColor', 'uGlow', 'uHighlight', 'uCausticStrength'];
    lib.define('sculpture', {
      shader: SHADERS.sculpture,
      attributes: ['position', 'normal'],
      uniforms: sculptureUniforms,
      setup: sculpture(0),
    });
    lib.define('sculptureGlow', {
      shader: SHADERS.sculpture,
      attributes: ['position', 'normal'],
      uniforms: sculptureUniforms,
      setup: (m) => {
        sculpture(0.55)(m);
        m.setColor3('uStoneColor', new Color3(0.3, 0.42, 0.46));
      },
    });
    lib.define('fish', {
      shader: SHADERS.fish,
      attributes: ['position', 'normal'],
      uniforms: ['uBackColor', 'uBellyColor', 'uSwimSpeed', 'uSwayAmount'],
      backFace: true,
      setup: (m) => {
        m.setColor3('uBackColor', PALETTE.fishBack);
        m.setColor3('uBellyColor', PALETTE.fishBelly);
        m.setFloat('uSwimSpeed', 9);
        m.setFloat('uSwayAmount', 0.09);
      },
    });
    lib.define('manta', {
      shader: SHADERS.manta,
      attributes: ['position', 'normal'],
      uniforms: [],
      backFace: true,
    });
    lib.define('godrays', {
      shader: SHADERS.godrays,
      uniforms: ['uRayColor', 'uIntensity'],
      alpha: true,
      backFace: true,
      setup: (m) => {
        m.setColor3('uRayColor', PALETTE.ray);
        m.setFloat('uIntensity', 0.32);
      },
    });
    lib.define('dome', {
      shader: SHADERS.dome,
      attributes: ['position'],
      uniforms: ['uSurfaceColor'],
      backFace: true,
      setup: (m) => {
        m.setColor3('uSurfaceColor', PALETTE.surface);
        m.disableDepthWrite = true;
      },
    });
    return lib;
  }
}
