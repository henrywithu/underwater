import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { clamp, damp } from '@/core/math';
import { CANYON, canyonCenter, terrainHeight } from '@/scene/world/Terrain';
import type { Input } from './Input';
import type { CameraController, CameraPose } from './types';

/**
 * "Immersive" mode: swim freely. WASD / arrows move, Space / Shift (or E / Q) rise and
 * sink, dragging looks around. On touch screens the left half spawns a virtual stick.
 * Motion has buoyant inertia and the camera is kept above the sand and inside the
 * canyon walls.
 */
export class FreeSwimController implements CameraController {
  readonly stiffness = 14;
  private pos = new Vector3();
  private vel = new Vector3();
  private yaw = 0;
  private pitch = 0;
  private yawVel = 0;
  private pitchVel = 0;
  private time = 0;
  speed = 4.2;

  enter(current: CameraPose) {
    this.pos.copyFrom(current.position);
    this.yaw = current.yaw;
    this.pitch = current.pitch;
    this.vel.setAll(0);
  }

  get position() {
    return this.pos;
  }

  update(dt: number, input: Input, out: CameraPose) {
    this.time += dt;
    // look: drag velocity with a little momentum
    const lookK = input.joystickEnabled ? 0.006 : 0.0042;
    if (input.dragging) {
      this.yawVel = input.dragX * lookK / Math.max(dt, 1e-3);
      this.pitchVel = input.dragY * lookK / Math.max(dt, 1e-3);
    } else {
      this.yawVel = damp(this.yawVel, 0, 6, dt);
      this.pitchVel = damp(this.pitchVel, 0, 6, dt);
    }
    this.yaw += this.yawVel * dt;
    this.pitch = clamp(this.pitch + this.pitchVel * dt, -1.2, 1.2);

    // move intent in camera space
    let fwd = 0, side = 0, up = 0;
    if (input.isDown('KeyW', 'ArrowUp')) fwd += 1;
    if (input.isDown('KeyS', 'ArrowDown')) fwd -= 1;
    if (input.isDown('KeyD', 'ArrowRight')) side += 1;
    if (input.isDown('KeyA', 'ArrowLeft')) side -= 1;
    if (input.isDown('Space', 'KeyE')) up += 1;
    if (input.isDown('ShiftLeft', 'ShiftRight', 'KeyQ')) up -= 1;
    if (input.joystick.active) {
      fwd += -input.joystick.y;
      side += input.joystick.x;
    }
    // wheel nudges forward/back so trackpad users can swim too
    fwd += clamp(-input.wheel / 60, -3, 3);

    const cp = Math.cos(this.pitch);
    const forward = new Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    const right = new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = forward.scale(fwd).addInPlace(right.scale(side)).addInPlaceFromFloats(0, up, 0);
    if (wish.lengthSquared() > 1) wish.normalize();

    // water drag: accelerate toward the wished velocity, glide when released
    const target = wish.scale(this.speed);
    const k = wish.lengthSquared() > 0 ? 2.4 : 1.1;
    this.vel.x = damp(this.vel.x, target.x, k, dt);
    this.vel.y = damp(this.vel.y, target.y, k, dt);
    this.vel.z = damp(this.vel.z, target.z, k, dt);
    this.pos.addInPlace(this.vel.scale(dt));

    // constraints: above the floor, below the surface, inside the canyon
    const floor = terrainHeight(this.pos.x, this.pos.z) + 1.1;
    if (this.pos.y < floor) {
      this.pos.y = damp(this.pos.y, floor, 20, dt);
      this.vel.y = Math.max(this.vel.y, 0);
    }
    this.pos.y = Math.min(this.pos.y, 12);
    this.pos.z = clamp(this.pos.z, CANYON.zEnd - 10, CANYON.zStart + 6);
    const c = canyonCenter(this.pos.z);
    this.pos.x = clamp(this.pos.x, c - 38, c + 38);

    out.position.copyFrom(this.pos);
    // gentle bob, stronger while moving (swimming strokes)
    const swim = Math.min(1, this.vel.length() / this.speed);
    out.position.y += Math.sin(this.time * (1.2 + swim * 2.4)) * (0.04 + swim * 0.06);
    out.yaw = this.yaw;
    out.pitch = this.pitch;
    out.fov = 0.95 + swim * 0.05;
  }
}
