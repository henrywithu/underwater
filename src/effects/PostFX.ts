import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';

import { SHADERS } from '@/shaders';
import { damp } from '@/core/math';
import type { Input } from '@/controls/Input';

/**
 * Post stack:
 *  1. Babylon's DefaultRenderingPipeline: depth of field (the "miniature / murky water"
 *     softness), bloom on caustics and glowing slabs, grain, vignette, ACES tone mapping.
 *  2. Our own underwater pass (post/underwater.fragment.glsl): refraction wobble,
 *     transition ripple, mouse lens and edge chromatic split.
 */
export class PostFX {
  readonly pipeline: DefaultRenderingPipeline;
  readonly underwater: PostProcess;
  private time = 0;
  private transition = 0;
  private transitionTarget = 0;
  private mouse = { x: 0.5, y: 0.5, force: 0 };
  private focusTarget = 9000;

  constructor(scene: Scene, camera: Camera, lowPower: boolean) {
    const p = new DefaultRenderingPipeline('uw-pipeline', true, scene, [camera]);
    p.samples = lowPower ? 1 : 4;
    p.fxaaEnabled = lowPower;

    p.depthOfFieldEnabled = true;
    p.depthOfFieldBlurLevel = lowPower ? DepthOfFieldEffectBlurLevel.Low : DepthOfFieldEffectBlurLevel.Medium;
    p.depthOfField.focalLength = 60;
    p.depthOfField.fStop = 2.2;
    p.depthOfField.focusDistance = 9000; // mm

    p.bloomEnabled = true;
    p.bloomThreshold = 0.62;
    p.bloomWeight = 0.45;
    p.bloomKernel = 64;
    p.bloomScale = 0.5;

    p.grainEnabled = true;
    p.grain.intensity = 7;
    p.grain.animated = true;

    p.imageProcessingEnabled = true;
    const ip = p.imageProcessing;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.15;
    ip.contrast = 1.12;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 2.6;
    ip.vignetteStretch = 0.4;
    ip.vignetteColor = new Color4(0.0, 0.03, 0.08, 1);
    ip.vignetteCameraFov = 0.9;
    this.pipeline = p;

    this.underwater = new PostProcess(
      'uw-underwater', SHADERS.underwaterPost,
      ['uResolution', 'uTime', 'uWobble', 'uTransition', 'uMouse', 'uMouseForce'],
      null, 1, camera,
    );
    this.underwater.onApply = (effect) => {
      effect.setFloat2('uResolution', this.underwater.width, this.underwater.height);
      effect.setFloat('uTime', this.time);
      effect.setFloat('uWobble', 1);
      effect.setFloat('uTransition', this.transition);
      effect.setFloat2('uMouse', this.mouse.x, 1 - this.mouse.y);
      effect.setFloat('uMouseForce', this.mouse.force);
    };
  }

  /** Play the water-ripple transition (0 -> 1). */
  ripple() {
    this.transition = 0;
    this.transitionTarget = 1;
  }

  /** Focus distance in metres (depth of field). */
  focusAt(metres: number) {
    this.focusTarget = metres * 1000;
  }

  setDofStrength(fStop: number) {
    this.pipeline.depthOfField.fStop = fStop;
  }

  update(dt: number, input: Input) {
    this.time += dt;
    if (this.transitionTarget > 0) {
      this.transition += dt / 1.6;
      if (this.transition >= 1) { this.transition = 0; this.transitionTarget = 0; }
    }
    // the mouse lens swells while the cursor moves and settles when it rests
    const mx = input.mouse.x, my = input.mouse.y;
    const speed = Math.hypot(mx - this.mouse.x, my - this.mouse.y) / Math.max(dt, 1e-3);
    this.mouse.x = damp(this.mouse.x, mx, 10, dt);
    this.mouse.y = damp(this.mouse.y, my, 10, dt);
    const target = input.mouse.inside ? Math.min(1, 0.25 + speed * 0.4) : 0;
    this.mouse.force = damp(this.mouse.force, target, 3, dt);

    const dof = this.pipeline.depthOfField;
    dof.focusDistance = damp(dof.focusDistance, this.focusTarget, 2.5, dt);
  }
}
