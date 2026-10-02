import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

import { damp } from '@/core/math';
import type { Input } from './Input';
import { CameraPose, type CameraController } from './types';

/** Shortest signed angle from a to b. */
function angleDelta(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Owns the single scene camera. The active controller writes a target pose each
 * frame and the director eases the real camera toward it. Switching controllers
 * therefore always produces a smooth glide instead of a cut. During a switch the
 * stiffness ramps up from a low value so long moves start gently.
 */
export class CameraDirector {
  readonly camera: UniversalCamera;
  readonly pose = new CameraPose();
  private target = new CameraPose();
  private active: CameraController | null = null;
  private blend = 1; // 0 right after a switch -> 1

  constructor(scene: Scene, start: Vector3) {
    this.camera = new UniversalCamera('main', start.clone(), scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 600;
    this.camera.inputs.clear(); // all input is handled by our controllers
    this.pose.position.copyFrom(start);
  }

  use(controller: CameraController) {
    if (controller === this.active) return;
    controller.enter(this.pose);
    this.active = controller;
    this.blend = 0;
  }

  get controller() {
    return this.active;
  }

  /** Jump without easing (used once at boot). */
  snap(controller: CameraController, input: Input) {
    this.active = controller;
    controller.update(0, input, this.target);
    this.pose.copyFrom(this.target);
    this.blend = 1;
    this.apply();
  }

  update(dt: number, input: Input) {
    if (!this.active) return;
    this.active.update(dt, input, this.target);
    this.blend = Math.min(1, this.blend + dt * 0.6);
    const k = this.active.stiffness * (0.25 + 0.75 * this.blend * this.blend);
    const t = 1 - Math.exp(-k * dt);
    Vector3.LerpToRef(this.pose.position, this.target.position, t, this.pose.position);
    this.pose.yaw += angleDelta(this.pose.yaw, this.target.yaw) * t;
    this.pose.pitch += (this.target.pitch - this.pose.pitch) * t;
    this.pose.fov = damp(this.pose.fov, this.target.fov, 3, dt);
    this.apply();
  }

  private apply() {
    this.camera.position.copyFrom(this.pose.position);
    this.camera.rotation.set(this.pose.pitch, this.pose.yaw, 0);
    this.camera.fov = this.pose.fov;
  }
}
