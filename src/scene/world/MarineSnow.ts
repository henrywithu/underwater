import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { BoxParticleEmitter } from '@babylonjs/core/Particles/EmitterTypes/boxParticleEmitter';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';

/** Soft round sprite drawn at runtime: no texture file needed. */
function createDotTexture(scene: Scene, size = 64, hardness = 0.35) {
  const tex = new DynamicTexture('dot', { width: size, height: size }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(hardness, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update();
  tex.hasAlpha = true;
  return tex;
}

/**
 * Suspended sediment ("marine snow"): two particle layers emitted in a box that
 * follows the camera. Fine specks drift slowly; a few larger out-of-focus motes pass
 * close to the lens. Particles are camera-relative so the density never thins out.
 */
export class MarineSnow {
  private systems: ParticleSystem[] = [];
  private anchor: Vector3;

  constructor(scene: Scene, private camera: Camera, lowPower: boolean) {
    this.anchor = camera.globalPosition.clone();
    const dot = createDotTexture(scene);
    const soft = createDotTexture(scene, 64, 0.05);

    const fine = this.make(scene, 'snow-fine', dot, lowPower ? 900 : 2200, {
      box: 22, size: [0.02, 0.06], life: [8, 14], rate: lowPower ? 90 : 220,
      color1: new Color4(0.75, 0.95, 1, 0.55), color2: new Color4(0.55, 0.85, 0.95, 0.3),
    });
    const motes = this.make(scene, 'snow-motes', soft, lowPower ? 40 : 90, {
      box: 7, size: [0.12, 0.3], life: [5, 9], rate: lowPower ? 6 : 12,
      color1: new Color4(0.7, 0.95, 1, 0.22), color2: new Color4(0.5, 0.8, 0.9, 0.12),
    });
    this.systems.push(fine, motes);
  }

  private make(
    scene: Scene, name: string, texture: DynamicTexture, capacity: number,
    o: { box: number; size: [number, number]; life: [number, number]; rate: number; color1: Color4; color2: Color4 },
  ) {
    const ps = new ParticleSystem(name, capacity, scene);
    ps.particleTexture = texture;
    // a Vector3 emitter is shared by reference, so moving it moves the emission box
    ps.emitter = this.anchor;
    const emitter = new BoxParticleEmitter();
    emitter.minEmitBox = new Vector3(-o.box, -o.box * 0.6, -o.box);
    emitter.maxEmitBox = new Vector3(o.box, o.box * 0.6, o.box);
    emitter.direction1 = new Vector3(-0.15, -0.08, -0.1);
    emitter.direction2 = new Vector3(0.2, 0.04, 0.12);
    ps.particleEmitterType = emitter;
    ps.minSize = o.size[0];
    ps.maxSize = o.size[1];
    ps.minLifeTime = o.life[0];
    ps.maxLifeTime = o.life[1];
    ps.emitRate = o.rate;
    ps.minEmitPower = 0.05;
    ps.maxEmitPower = 0.25;
    ps.color1 = o.color1;
    ps.color2 = o.color2;
    ps.colorDead = new Color4(0.5, 0.8, 0.9, 0);
    ps.addColorGradient(0, new Color4(1, 1, 1, 0));
    ps.addColorGradient(0.2, o.color1);
    ps.addColorGradient(0.8, o.color2);
    ps.addColorGradient(1, new Color4(1, 1, 1, 0));
    ps.minAngularSpeed = -0.4;
    ps.maxAngularSpeed = 0.4;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.gravity = new Vector3(0, -0.015, 0);
    ps.preWarmCycles = 120;
    ps.preWarmStepOffset = 10;
    ps.isLocal = false;
    ps.start();
    return ps;
  }

  update() {
    this.anchor.copyFrom(this.camera.globalPosition);
  }

  dispose() {
    this.systems.forEach((s) => s.dispose());
  }
}
