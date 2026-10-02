import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { clamp, damp } from '@/core/math';
import { terrainHeight } from '@/scene/world/Terrain';
import type { PlacedSculpture } from '@/scene/sculptures/SculptureGarden';
import type { Input } from './Input';
import type { CameraController, CameraPose } from './types';

/**
 * Sculpture viewing: the camera orbits a piece slowly. Dragging (or the wheel) spins
 * the orbit and changes the distance; releasing lets it drift on.
 */
export class FocusController implements CameraController {
  readonly stiffness = 2.2;
  private piece: PlacedSculpture | null = null;
  private angle = 0;
  private angleVel = 0.06;
  private distance = 10;
  private distTarget = 10;
  private height = 3;

  setTarget(piece: PlacedSculpture) {
    this.piece = piece;
    this.angle = piece.info.rotation + piece.info.view.angle;
    this.distance = this.distTarget = piece.info.view.distance;
    this.height = piece.info.view.height;
  }

  enter(current: CameraPose) {
    void current;
  }

  update(dt: number, input: Input, out: CameraPose) {
    const p = this.piece;
    if (!p) return;
    if (input.dragging) this.angleVel = -input.dragX * 0.004 / Math.max(dt, 1e-3) * 0.25;
    else this.angleVel = damp(this.angleVel, 0.06, 0.8, dt);
    this.angle += this.angleVel * dt;
    this.distTarget = clamp(this.distTarget + input.wheel * 0.006, p.built.radius + 3, p.info.view.distance * 1.8);
    this.distance = damp(this.distance, this.distTarget, 4, dt);

    const c = p.center;
    const pos = new Vector3(c.x + Math.sin(this.angle) * this.distance, 0, c.z + Math.cos(this.angle) * this.distance);
    pos.y = Math.max(p.position.y + this.height, terrainHeight(pos.x, pos.z) + 1.4);
    out.position.copyFrom(pos);
    out.lookAt(c);
    out.fov = 0.85;
  }
}
