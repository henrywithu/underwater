import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Input } from './Input';

/** The pose a controller asks the camera director to reach. */
export class CameraPose {
  position = new Vector3();
  yaw = 0;
  pitch = 0;
  fov = 0.9;

  copyFrom(o: CameraPose) {
    this.position.copyFrom(o.position);
    this.yaw = o.yaw;
    this.pitch = o.pitch;
    this.fov = o.fov;
    return this;
  }

  lookAt(target: Vector3) {
    const d = target.subtract(this.position);
    this.yaw = Math.atan2(d.x, d.z);
    this.pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z));
    return this;
  }
}

export interface CameraController {
  /** Called when the controller becomes active, with the camera's current pose. */
  enter(current: CameraPose): void;
  update(dt: number, input: Input, out: CameraPose): void;
  /** How fast the director should converge to this controller's pose (1/s). */
  readonly stiffness: number;
}
